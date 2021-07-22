import * as THREE from 'three'
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils'
import ObjectWrapper from './ObjectWrapper'
import { getConversionFactor } from './Units'

/**
 * Utility class providing some top level conversion methods.
 * Warning: HIC SVNT DRACONES.
  */
export default class Coverter {

  constructor( objectLoader ) {
    if ( !objectLoader ) {
      console.warn( 'Converter initialized without a corresponding object loader. Any objects that include references will throw errors.' )
    }

    this.objectLoader = objectLoader
    this.curveSegmentLength = 0.1
  }

  /**
   * If the object is convertible (there is a direct conversion routine), it will invoke the callback with the conversion result.
   * If the object is not convertible, it will recursively iterate through it (arrays & objects) and invoke the callback on any positive conversion result.
   * @param  {[type]}   obj      [description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  async traverseAndConvert( obj, callback, scale = true ) {
    // Exit on primitives (string, ints, bools, bigints, etc.)
    if ( typeof obj !== 'object' ) return
    if ( obj.referencedId ) obj = await this.resolveReference( obj )

    let childrenConversionPromisses = []

    // Traverse arrays, and exit early (we don't want to iterate through many numbers)
    if ( Array.isArray( obj ) ) {
      for ( let element of obj ) {
        if ( typeof element !== 'object' ) break // exit early for non-object based arrays
        let childPromise = this.traverseAndConvert( element, callback, scale )
        childrenConversionPromisses.push( childPromise )
      }
      await Promise.all( childrenConversionPromisses )
      return
    }

    // If we can convert it, we should invoke the respective conversion routine.
    const type = this.getSpeckleType( obj )
    
    if ( this[`${type}ToBufferGeometry`] ) {
      try {
        callback( await this[`${type}ToBufferGeometry`]( obj.data || obj, scale ) )
        return
      } catch ( e ) {
        console.warn( `(Traversing - direct) Failed to convert ${type} with id: ${obj.id}`, e )
      }
    }

    let target = obj.data || obj

    // Check if the object has a display value of sorts
    let displayValue = target['displayMesh'] || target['@displayMesh'] || target['displayValue'] || target['@displayValue']
    if ( displayValue ) {
      if ( !Array.isArray( displayValue ) ) {
        displayValue = await this.resolveReference( displayValue )
        if ( !displayValue.units ) displayValue.units = obj.units
        try {
          let { bufferGeometry } = await this.convert( displayValue, scale )
          callback( new ObjectWrapper( bufferGeometry, obj ) ) // use the parent's metadata!
        } catch ( e ) {
          console.warn( `(Traversing) Failed to convert obj with id: ${obj.id} — ${e.message}` )
        }
      } else {
        for ( let element of displayValue ) {
          let val = await this.resolveReference( element )
          if ( !val.units ) val.units = obj.units
          let { bufferGeometry } = await this.convert( val, scale )
          callback( new ObjectWrapper( bufferGeometry, { renderMaterial: val.renderMaterial } ) )
        }
      }
    }

    // If this is a built element and has a display value, only iterate through the "elements" prop if it exists.
    if ( displayValue && obj.speckle_type.toLowerCase().includes( 'builtelements' ) ) {
      if ( obj['elements'] ) {
        childrenConversionPromisses.push( this.traverseAndConvert( obj['elements'], callback, scale ) )
        await Promise.all( childrenConversionPromisses )
      }
      return
    }

    // Last attempt: iterate through all object keys and see if we can display anything!
    // traverses the object in case there's any sub-objects we can convert.
    for ( let prop in target ) {
      if ( prop === 'bbox' ) continue
      if ( typeof target[prop] !== 'object' ) continue
      let childPromise = this.traverseAndConvert( target[prop], callback, scale )
      childrenConversionPromisses.push( childPromise )
    }
    await Promise.all( childrenConversionPromisses )
  }

  /**
   * Directly converts an object and invokes the callback with the the conversion result.
   * If you don't know what you're doing, use traverseAndConvert() instead.
   * @param  {[type]} obj [description]
   * @param  {Function} callback [description]
   * @return {[type]}     [description]
   */
  async convert( obj, scale = true ) {
    if ( obj.referencedId ) obj = await this.resolveReference( obj )
    try {
      let type = this.getSpeckleType( obj )
      if ( this[`${type}ToBufferGeometry`] ) {
        return await this[`${type}ToBufferGeometry`]( obj.data || obj, scale )
      }
      else return null
    } catch ( e ) {
      console.warn( `(Direct convert) Failed to convert object with id: ${obj.id}` )
      throw e
    }
  }

  /**
   * Takes an array composed of chunked references and dechunks it.
   * @param  {[type]} arr [description]
   * @return {[type]}     [description]
   */
  async dechunk( arr ) {
    if ( !arr || arr.length === 0 ) return arr
    // Handles pre-chunking objects, or arrs that have not been chunked
    if ( !arr[0].referencedId ) return arr

    let dechunked = []
    for ( let ref of arr ) {
      let real = await this.objectLoader.getObject( ref.referencedId )
      dechunked.push( ...real.data )
    }
    return dechunked
  }

  /**
   * Resolves an object reference by waiting for the loader to load it up.
   * @param  {[type]} obj [description]
   * @return {[type]}     [description]
   */
  async resolveReference( obj ) {
    if ( obj.referencedId )
      return await this.objectLoader.getObject( obj.referencedId )
    else return obj
  }

  /**
   * Gets the speckle type of an object in various scenarios.
   * @param  {[type]} obj [description]
   * @return {[type]}     [description]
   */
  getSpeckleType( obj ) {
    let type = 'Base'
    if ( obj.data )
      type = obj.data.speckle_type ? obj.data.speckle_type.split( '.' ).reverse()[0] : type
    else
      type = obj.speckle_type ? obj.speckle_type.split( '.' ).reverse()[0] : type
    return type
  }

  async View3DToBufferGeometry( obj ) {
    obj.origin.units = obj.units
    obj.target.units = obj.units
    let origin = this.PointToVector3( obj.origin )
    let target = this.PointToVector3( obj.target )
    obj.origin = origin
    obj.target = target
    return new ObjectWrapper( obj, obj, 'View' )
  }

  async BlockInstanceToBufferGeometry( obj, scale ) {

    let cF = scale ? getConversionFactor( obj.units ) : 1
    let definition = await this.resolveReference( obj.blockDefinition )

    const matrix = new THREE.Matrix4().set( ...obj.transform )
    let geoms = []
    for ( let obj of definition.geometry ) {
      // Note: we are passing scale = false to the conversion of all objects, as scaling *needs* to happen
      // at a global group level.
      let res = await this.convert ( await this.resolveReference( obj ), false )
      // We are not baking the matrix transform in the vertices so as to allow
      // for easy composed transforms coming in at nested block levels
      // res.bufferGeometry.applyMatrix4( matrix )
      geoms.push( res )
    }

    return new ObjectWrapper( geoms, obj, 'block', { transformMatrix: matrix, scaleMatrix: new THREE.Matrix4().makeScale( cF, cF, cF ) } )
  }

  async PointcloudToBufferGeometry( obj, scale = true ) {

    let conversionFactor = scale ? getConversionFactor( obj.units ) : 1
    let buffer = new THREE.BufferGeometry( )

    let vertices = await this.dechunk( obj.points )

    buffer.setAttribute(
      'position',
      new THREE.Float32BufferAttribute( !scale || conversionFactor === 1 ? vertices : vertices.map( v => v * conversionFactor ), 3 ) )

    // TODO: checkout colours
    let colorsRaw = await this.dechunk( obj.colors )

    if ( colorsRaw && colorsRaw.length !== 0 ) {

      if ( colorsRaw.length !== buffer.attributes.position.count ) {
        console.warn( `Mesh (id ${obj.id}) colours are mismatched with vertice counts. The number of colours must equal the number of vertices.` )
      }

      buffer.setAttribute( 'color', new THREE.BufferAttribute( new Float32Array( buffer.attributes.position.count * 3 ), 3 ) )

      for ( let i = 0; i < buffer.attributes.position.count; i++ ) {
        let color = colorsRaw[i]
        let r = color >> 16 & 0xFF
        let g = color >> 8 & 0xFF
        let b = color & 0xFF
        buffer.attributes.color.setXYZ( i, r / 255, g / 255, b / 255 )
      }
    }

    // delete obj.points
    // delete obj.colors
    // delete obj.sizes // note, these might be used in the future

    return new ObjectWrapper( buffer, obj, 'pointcloud' )
  }

  async BrepToBufferGeometry( obj, scale = true ) {
    try {
      if ( !obj ) return
      let { bufferGeometry } = await this.MeshToBufferGeometry( await this.resolveReference( obj.displayValue || obj.displayMesh ), scale )

      // deletes known unneeded fields
      // delete obj.displayMesh
      // delete obj.displayValue
      delete obj.Edges
      delete obj.Faces
      delete obj.Loops
      delete obj.Trims
      delete obj.Curve2D
      delete obj.Curve3D
      delete obj.Surfaces
      delete obj.Vertices

      return new ObjectWrapper( bufferGeometry, obj )
    } catch ( e ) {
      console.warn( `Failed to convert brep id: ${obj.id}` )
      throw e
    }
  }

  async MeshToBufferGeometry( obj, scale = true ) {
    try {
      if ( !obj ) return

      let conversionFactor = getConversionFactor( obj.units )
      let buffer = new THREE.BufferGeometry( )
      let indices = [ ]

      if ( !obj.vertices ) return
      if ( !obj.faces ) return

      let vertices = await this.dechunk( obj.vertices )
      let faces = await this.dechunk( obj.faces )

      let k = 0
      while ( k < faces.length ) {
        if ( faces[ k ] === 1 ) { // QUAD FACE
          indices.push( faces[ k + 1 ], faces[ k + 2 ], faces[ k + 3 ] )
          indices.push( faces[ k + 1 ], faces[ k + 3 ], faces[ k + 4 ] )
          k += 5
        } else if ( faces[ k ] === 0 ) { // TRIANGLE FACE
          indices.push( faces[ k + 1 ], faces[ k + 2 ], faces[ k + 3 ] )
          k += 4
        } else throw new Error( `Mesh type not supported. Face topology indicator: ${faces[k]}` )
      }
      buffer.setIndex( indices )

      buffer.setAttribute(
        'position',
        new THREE.Float32BufferAttribute( !scale || conversionFactor === 1 ? vertices : vertices.map( v => v * conversionFactor ), 3 ) )


      let colorsRaw = await this.dechunk( obj.colors )

      if ( colorsRaw && colorsRaw.length !== 0 ) {

        if ( colorsRaw.length !== buffer.attributes.position.count ) {
          console.warn( `Mesh (id ${obj.id}) colours are mismatched with vertice counts. The number of colours must equal the number of vertices.` )
        }

        buffer.setAttribute( 'color', new THREE.BufferAttribute( new Float32Array( buffer.attributes.position.count * 3 ), 3 ) )

        for ( let i = 0; i < buffer.attributes.position.count; i++ ) {
          let color = colorsRaw[i]
          let r = color >> 16 & 0xFF
          let g = color >> 8 & 0xFF
          let b = color & 0xFF
          buffer.attributes.color.setXYZ( i, r / 255, g / 255, b / 255 )
        }
      }


      buffer.computeVertexNormals( )
      buffer.computeFaceNormals( )
      buffer.computeBoundingSphere( )

      // delete obj.vertices
      // delete obj.faces
      // delete obj.colors

      return new ObjectWrapper( buffer, obj )
    } catch ( e ) {
      console.warn( `Failed to convert mesh with id: ${obj.id}` )
      throw e
    }
  }

  async PointToBufferGeometry( obj, scale = true ) {
    let v = this.PointToVector3( obj, scale )
    let buf = new THREE.BufferGeometry().setFromPoints( [ v ] )

    return new ObjectWrapper( buf, obj, 'point' )
  }

  async LineToBufferGeometry( object, scale = true ) {
    if ( object.value ) {
      //Old line format, treat as polyline
      return this.PolylineToBufferGeometry( object, scale )
    }
    let obj = {}
    Object.assign( obj, object )

    const geometry = new THREE.BufferGeometry().setFromPoints( [ this.PointToVector3( obj.start, scale ), this.PointToVector3( obj.end, scale ) ] )
    return new ObjectWrapper( geometry, obj, 'line' )
  }

  async PolylineToBufferGeometry( object, scale = true ) {
    let obj = {}
    Object.assign( obj, object )

    let conversionFactor = scale ? getConversionFactor( obj.units ) : 1

    obj.value = await this.dechunk( obj.value )

    const points = []
    for ( let i = 0; i < obj.value.length; i += 3 ) {
      points.push( new THREE.Vector3( obj.value[i] * conversionFactor,obj.value[i + 1] * conversionFactor,obj.value[i + 2] * conversionFactor ) )
    }
    if ( obj.closed )
      points.push( points[0] )

    const geometry = new THREE.BufferGeometry().setFromPoints( points )

    delete obj.value
    delete obj.bbox

    return new ObjectWrapper( geometry, obj, 'line' )
  }

  async BoxToBufferGeometry( object, scale = true ) {
    let conversionFactor = scale ? getConversionFactor( object.units ) : 1

    let move = this.PointToVector3( object.basePlane.origin )
    let width = ( object.xSize.end - object.xSize.start ) * conversionFactor
    let depth = ( object.ySize.end - object.ySize.start ) * conversionFactor
    let height = ( object.zSize.end - object.zSize.start ) * conversionFactor

    let box = new THREE.BoxBufferGeometry( width, depth, height, 1,1,1 )
    box.applyMatrix4( new THREE.Matrix4().setPosition( move ) )

    return new ObjectWrapper( box, object )
  }

  async PolycurveToBufferGeometry( object, scale = true ) {
    let obj = {}
    Object.assign( obj, object )

    let buffers = []
    for ( let i = 0; i < obj.segments.length; i++ ) {
      const element = obj.segments[i]
      const conv = await this.convert( element, scale )
      buffers.push( conv?.bufferGeometry )
    }
    let geometry = BufferGeometryUtils.mergeBufferGeometries( buffers )

    return new ObjectWrapper( geometry , obj, 'line' )
  }

  async CurveToBufferGeometry( object, scale = true ) {
    let obj = {}
    Object.assign( obj, object )
    obj.displayValue.units = obj.displayValue.units || obj.units
    const poly = await this.PolylineToBufferGeometry( obj.displayValue, scale )

    return new ObjectWrapper( poly.bufferGeometry, obj, 'line' )
  }

  async CircleToBufferGeometry( obj, scale = true ) {
    let conversionFactor = scale ? getConversionFactor( obj.units ) : 1
    const points = this.getCircularCurvePoints( obj.plane, obj.radius * conversionFactor )
    const geometry = new THREE.BufferGeometry().setFromPoints( points )

    // delete obj.plane
    // delete obj.value
    // delete obj.speckle_type
    // delete obj.bbox

    return new ObjectWrapper( geometry, obj, 'line' )
  }

  async ArcToBufferGeometry( obj, scale = true ) {
    const radius = obj.radius
    const curve = new THREE.EllipseCurve(
      0, 0,                           // ax, aY
      radius, radius,                 // xRadius, yRadius
      obj.startAngle, obj.endAngle,   // aStartAngle, aEndAngle
      false,                          // aClockwise
      0                               // aRotation
    )
    const points = curve.getPoints( 50 )
    const geometry = new THREE.BufferGeometry().setFromPoints( points ).applyMatrix4( this.PlaneToMatrix4( obj.plane, scale ) )

    return new ObjectWrapper( geometry, obj, 'line' )
  }

  async EllipseToBufferGeometry( obj, scale = true ) {
    const conversionFactor = scale ? getConversionFactor( obj.units ) : 1

    const center = new THREE.Vector3( obj.plane.origin.x  ,obj.plane.origin.y ,obj.plane.origin.z   ).multiplyScalar( conversionFactor )
    const xAxis = new THREE.Vector3( obj.plane.xdir.x,obj.plane.xdir.y,obj.plane.xdir.z ).normalize()
    const yAxis = new THREE.Vector3( obj.plane.ydir.x ,obj.plane.ydir.y,obj.plane.ydir.z  ).normalize()


    let resolution = 2 * Math.PI * obj.firstRadius * conversionFactor * 10
    resolution = parseInt( resolution.toString() )
    let points = []

    for ( let index = 0; index <= resolution; index++ ) {
      let t = index * Math.PI * 2 / resolution
      let x = Math.cos( t ) * obj.firstRadius * conversionFactor
      let y = Math.sin( t ) * obj.secondRadius * conversionFactor
      const xMove = new THREE.Vector3( xAxis.x * x, xAxis.y * x, xAxis.z * x )
      const yMove = new THREE.Vector3( yAxis.x * y, yAxis.y * y, yAxis.z * y )

      let pt = new THREE.Vector3().addVectors( xMove, yMove ).add( center )
      points.push( pt )
    }

    const geometry = new THREE.BufferGeometry().setFromPoints( points )
    return new ObjectWrapper( geometry, obj, 'line' )
  }

  PlaneToMatrix4( plane, scale = true ) {
    const m = new THREE.Matrix4()
    let conversionFactor = scale ? getConversionFactor( plane.units ) : 1

    m.makeBasis( this.PointToVector3( plane.xdir ).normalize(), this.PointToVector3( plane.ydir ).normalize(), this.PointToVector3( plane.normal ).normalize() )
    m.setPosition( this.PointToVector3( plane.origin ) )
    if ( scale ) {
      m.scale( new THREE.Vector3( conversionFactor, conversionFactor, conversionFactor ) )
    }
    return m
  }

  getCircularCurvePoints( plane, radius, startAngle = 0, endAngle = 2 * Math.PI, res = this.curveSegmentLength ) {

    // Get alignment vectors
    const center = this.PointToVector3( plane.origin )
    const xAxis = this.PointToVector3( plane.xdir )
    const yAxis = this.PointToVector3( plane.ydir )

    // Make sure plane axis are unit length!!!!
    xAxis.normalize()
    yAxis.normalize()


    // Determine resolution
    let resolution = ( endAngle - startAngle ) * radius / res
    resolution = parseInt( resolution.toString() )

    let points = []

    for ( let index = 0; index <= resolution; index++ ) {
      let t = startAngle + index * ( endAngle - startAngle ) / resolution
      let x = Math.cos( t ) * radius
      let y = Math.sin( t ) * radius
      const xMove = new THREE.Vector3( xAxis.x * x, xAxis.y * x, xAxis.z * x )
      const yMove = new THREE.Vector3( yAxis.x * y, yAxis.y * y, yAxis.z * y )

      const pt = new THREE.Vector3().addVectors( xMove, yMove ).add( center )
      points.push( pt )
    }
    return points
  }

  PointToVector3( obj, scale = true ) {
    let conversionFactor = scale ? getConversionFactor( obj.units ) : 1
    let v = null
    if ( obj.value ) {
      // Old point format based on value list
      v = new THREE.Vector3( obj.value[0] * conversionFactor, obj.value[1] * conversionFactor, obj.value[2] * conversionFactor )
    } else {
      // New point format based on cartesian coords
      v = new THREE.Vector3( obj.x * conversionFactor, obj.y * conversionFactor, obj.z * conversionFactor )
    }
    return v
  }
}
