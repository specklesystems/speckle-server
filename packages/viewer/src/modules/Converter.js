import * as THREE from 'three'
import { NURBSCurve } from 'three/examples/jsm/curves/NURBSCurve'
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils'
import ObjectWrapper from './ObjectWrapper'
import { getConversionFactor } from './Units'

/**
 * Utility class providing some top level conversion methods.
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
   * If the object is convertable (there is a direct conversion routine), it will invoke the callback with the conversion result.
   * If the object is not convertable, it will recursively iterate through it (arrays & objects) and invoke the callback on any postive conversion result.
   * @param  {[type]}   obj      [description]
   * @param  {Function} callback [description]
   * @return {[type]}            [description]
   */
  async traverseAndConvert( obj, callback ) {
    // Exit on primitives (string, ints, bools, bigints, etc.)
    if ( typeof obj !== 'object' ) return

    if ( obj.referencedId ) obj = await this.resolveReference( obj )

    // Traverse arrays, and exit early (we don't want to iterate through many numbers)
    if ( Array.isArray( obj ) ) {
      for ( let element of obj ) {
        if ( typeof element !== 'object' ) return // exit early for non-object based arrays
        ( async() => await this.traverseAndConvert( element, callback ) )() //iife so we don't block
      }
    }

    // If we can convert it, we should invoke the respective conversion routine.
    const type = this.getSpeckleType( obj )
    if ( this[`${type}ToBufferGeometry`] ) {
      try {
        callback( await this[`${type}ToBufferGeometry`]( obj.data || obj ) )
        return
      } catch ( e ) {
        console.warn( `(Traversing - direct) Failed to convert ${type} with id: ${obj.id}`, e )
      }
    }

    let target = obj.data || obj

    // Check if the object has a display value of sorts
    let displayValue = target['displayMesh'] || target['@displayMesh'] || target['displayValue']|| target['@displayValue']
    if ( displayValue ) {
      displayValue = await this.resolveReference( displayValue )
      if ( !displayValue.units ) displayValue.units = obj.units

      try {
        let { bufferGeometry } = await this.convert( displayValue )
        callback( new ObjectWrapper( bufferGeometry, obj ) ) // use the parent's metadata!

        // return // returning here is faster but excludes objects that have a display value and displayable children (ie, a wall with windows)
      } catch ( e ) {
        console.warn( `(Traversing) Failed to convert obj with id: ${obj.id} — ${e.message}` )
      }
    }

    // Last attempt: iterate through all object keys and see if we can display anything!
    // traverses the object in case there's any sub-objects we can convert.
    for ( let prop in target ) {
      if ( typeof target[prop] !== 'object' ) continue
      ( async() => await this.traverseAndConvert( target[prop], callback ) )() //iife so we don't block
    }
  }

  /**
   * Directly converts an object and invokes the callback with the the conversion result.
   * @param  {[type]} obj [description]
   * @param  {Function} callback [description]
   * @return {[type]}     [description]
   */
  async convert( obj ) {
    if ( obj.referencedId ) obj = await this.resolveReference( obj )
    try {
      let type = this.getSpeckleType( obj )
      if ( this[`${type}ToBufferGeometry`] ) {
        return await this[`${type}ToBufferGeometry`]( obj.data || obj )
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
    if ( !arr ) return arr
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

  async BrepToBufferGeometry( obj ) {
    try {
      if ( !obj ) return
      let { bufferGeometry } = await this.MeshToBufferGeometry( await this.resolveReference( obj.displayValue || obj.displayMesh ) )

      // deletes known uneeded fields
      delete obj.displayMesh
      delete obj.displayValue
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

  async MeshToBufferGeometry( obj ) {
    try {
      if ( !obj ) return

      let conversionFactor = getConversionFactor( obj.units )
      let buffer = new THREE.BufferGeometry( )
      let indices = [ ]

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
        new THREE.Float32BufferAttribute( conversionFactor === 1 ? vertices : vertices.map( v => v * conversionFactor ), 3 ) )

      buffer.computeVertexNormals( )
      buffer.computeFaceNormals( )
      buffer.computeBoundingSphere( )

      delete obj.vertices
      delete obj.faces

      return new ObjectWrapper( buffer, obj )
    } catch ( e ) {
      console.warn( `Failed to convert mesh with id: ${obj.id}` )
      throw e
    }
  }

  // TODOs:
  async PointToBufferGeometry( obj ) {
    let conversionFactor = getConversionFactor( obj.units )
    const v = new THREE.Vector3( obj.value[0]* conversionFactor,obj.value[1]* conversionFactor,obj.value[2] * conversionFactor )
    let buf = new THREE.BufferGeometry().setFromPoints( [ v ] )
    
    delete obj.value
    delete obj.speckle_type

    return new ObjectWrapper( buf, obj, 'point' )
  }

  async LineToBufferGeometry( obj ) {
    return this.PolylineToBufferGeometry( obj )
  }
  async PolylineToBufferGeometry( object ) {
    let obj = {}
    Object.assign( obj,object )
    delete object.value
    delete object.speckle_type

    let conversionFactor = getConversionFactor( obj.units )
    
    obj.value = await this.dechunk( obj.value )
    
    const points = []
    for ( let i = 0; i < obj.value.length; i+=3 ) {
      points.push( new THREE.Vector3( obj.value[ i ]* conversionFactor,obj.value[i+1]* conversionFactor,obj.value[i+2] * conversionFactor ) )
    }
    const geometry = new THREE.BufferGeometry().setFromPoints( points )

    delete obj.value

    return new ObjectWrapper( geometry, obj, 'line' )
  }

  async PolycurveToBufferGeometry( object ) {
    let obj = {}
    Object.assign( obj,object )
    delete object.value
    delete object.speckle_type
    delete object.displayValue
    delete object.segments

    let buffers = []
    for ( let i = 0; i < obj.segments.length; i++ ) {
      const element = obj.segments[i]
      const conv = await this.convert( element )
      buffers.push( conv?.bufferGeometry )
    }
    let geometry = BufferGeometryUtils.mergeBufferGeometries( buffers )
    
    delete obj.segments
    delete obj.speckle_type

    return new ObjectWrapper( geometry , obj, 'line' )
  }
  
  async CurveToBufferGeometry( object ) {
    let obj = {}
    Object.assign( obj,object )
    delete object.value
    delete object.speckle_type
    delete object.displayValue
    
    obj.points = await this.dechunk( obj.points )
    obj.weights = await this.dechunk( obj.weights )
    obj.knots = await this.dechunk( obj.knots )

    try {
      let conversionFactor = getConversionFactor( obj.units )
      
      // Convert points+weights to Vector4
      const points = []
      for ( let i = 0; i < obj.points.length; i+=3 ) {
        points.push( new THREE.Vector4( obj.points[ i ]* conversionFactor,obj.points[i+1]* conversionFactor,obj.points[i+2] * conversionFactor, obj.weights[i/3] * conversionFactor ) )
      }
      // Convert knots from rhino compact format to normal format.
      let knots = [ obj.knots[0] ]
      knots = knots.concat( obj.knots )
      knots.push( knots[knots.length -1] )
  
      // Create the nurbs curve
      const curve = new NURBSCurve( obj.degree, knots, points, null, null )
      
      // Delete everything unnecessary from the metadata object.
      delete obj.speckle_type
      delete obj.displayValue
      delete obj.points
      delete obj.weights
      delete obj.knots
      
      // Compute appropriate curve subdivisions
      let div = curve.getLength() / 0.1
      div = parseInt( div.toString() ) 
      if ( div < 20 ) div = 20
      if ( div > 4000 ) div = 4000

      // Divide the nurbs curve in points
      var pts = curve.getPoints( div )
      return new ObjectWrapper( new THREE.BufferGeometry().setFromPoints( pts ), obj, 'line' )

    } catch ( e ) {
      console.warn( 'Error converting nurbs curve, falling back to displayValue', obj )
      const poly = await this.PolylineToBufferGeometry( obj.displayValue )

      delete obj.speckle_type
      delete obj.displayValue
      delete obj.points
      delete obj.weights
      delete obj.knots

      return new ObjectWrapper( poly.bufferGeometry, obj, 'line' )
    }
  }

  async CircleToBufferGeometry( obj ) {
    const points = this.getCircularCurvePoints( obj.plane, obj.radius )
    const geometry = new THREE.BufferGeometry().setFromPoints( points )

    delete obj.value
    delete obj.speckle_type

    return new ObjectWrapper( geometry, obj, 'line' )
  }
  

  async ArcToBufferGeometry( obj ) {
    const points = this.getCircularCurvePoints( obj.plane, obj.radius, obj.startAngle, obj.endAngle )
    const geometry = new THREE.BufferGeometry().setFromPoints( points )

    delete obj.speckle_type
    delete obj.startPoint
    delete obj.endPoint
    delete obj.plane
    delete obj.midPoint

    return new ObjectWrapper( geometry, obj, 'line' )
  }
  getCircularCurvePoints( plane, radius, startAngle = 0, endAngle = 2*Math.PI, res = this.curveSegmentLength ) {

    // Get alignment vectors
    const center = new THREE.Vector3( plane.origin.value[0], plane.origin.value[1], plane.origin.value[2] )
    const xAxis = new THREE.Vector3( plane.xdir.value[0], plane.xdir.value[1], plane.xdir.value[2] )
    const yAxis = new THREE.Vector3( plane.ydir.value[0], plane.ydir.value[1], plane.ydir.value[2] )

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

      let pt = new THREE.Vector3().addVectors( xMove, yMove ).add( center )
      points.push( pt )
    }
    return points
  }

  async EllipseToBufferGeometry( obj ) {
    
    const center = new THREE.Vector3( obj.plane.origin.value[0],obj.plane.origin.value[1],obj.plane.origin.value[2] )
    const xAxis = new THREE.Vector3( obj.plane.xdir.value[0],obj.plane.xdir.value[1],obj.plane.xdir.value[2] )
    const yAxis = new THREE.Vector3( obj.plane.ydir.value[0],obj.plane.ydir.value[1],obj.plane.ydir.value[2] )

    let resolution = 2 * Math.PI * obj.radius1 / 0.1
    resolution = parseInt( resolution.toString() )
    let points = []

    for ( let index = 0; index <= resolution; index++ ) {
      let t = index * Math.PI * 2 / resolution
      let x = Math.cos( t ) * obj.radius1
      let y = Math.sin( t ) * obj.radius2
      const xMove = new THREE.Vector3( xAxis.x * x, xAxis.y * x, xAxis.z * x )
      const yMove = new THREE.Vector3( yAxis.x * y, yAxis.y * y, yAxis.z * y )
  
      let pt = new THREE.Vector3().addVectors( xMove, yMove ).add( center )
      points.push( pt )
    }

    const geometry = new THREE.BufferGeometry().setFromPoints( points )

    delete obj.value
    delete obj.speckle_type

    return new ObjectWrapper( geometry, obj, 'line' )
  }
}
