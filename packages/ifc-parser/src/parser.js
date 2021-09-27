const WebIFC = require( 'web-ifc/web-ifc-api-node' )
const ObjectSaver = require( './api.js' )

module.exports = class IFCParser {
  
  constructor( { objectSaver } ) {
    this.api = new WebIFC.IfcAPI()
    this.objectSaver = objectSaver || new ObjectSaver()
  }

  async parse( data ) {
    if ( this.api.wasmModule === undefined ) await this.api.Init()

    this.modelId = this.api.OpenModel( data, { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true } )

    this.projectId = this.api.GetLineIDsWithType( this.modelId, WebIFC.IFCPROJECT ).get( 0 )

    this.project = this.api.GetLine( this.modelId, this.projectId, true )
    this.project.__closure = {}
    

    // Steps: create and store in speckle all the geometries (meshes) from this project and store them 
    // as reference objects in this.productGeo
    this.productGeo = {}
    await this.createGeometries()    
    console.log(`Geometries created: ${Object.keys(this.productGeo).length} meshes.`)
    
    // Lastly, traverse the ifc project object and parse it into something friendly; as well as 
    // replace all its geometries with actual references to speckle meshes from the productGeo map
    
    await this.traverse( this.project, true, 0 )
    
    let id = await this.objectSaver.saveObject( this.project )
    return { id, tCount: Object.keys(this.project.__closure).length }
  }

  async createGeometries() {
    // NOTE: this is where we can alreadt create speckle meshes and plop them in the db.
    this.rawGeo = this.api.LoadAllGeometry( this.modelId )
    let materialMap = {}
    
    for( let i = 0; i < this.rawGeo.size(); i++ ) {
      const mesh = this.rawGeo.get( i )
      const prodId = mesh.expressID
      this.productGeo[prodId ] = []
      
      for( let j = 0; j < mesh.geometries.size(); j++ ) {
        let geom = this.api.GetGeometry( this.modelId, mesh.geometries.get( j ).geometryExpressID )

        let mat = mesh.geometries.get( j ).flatTransformation 
        let raw = {
          color: geom.color, // NOTE: material: x, y, z = rgb, w = opacity
          vertices: this.api.GetVertexArray( geom.GetVertexData(), geom.GetVertexDataSize() ),
          indices: this.api.GetIndexArray( geom.GetIndexData(), geom.GetIndexDataSize() )
        }
        
        const { vertices, normals } = this.extractVertexData(raw.vertices)

        for(let k = 0; k< vertices.length;k+=3){
          let x = vertices[k], y = vertices[k+1], z = vertices[k+2]
          vertices[k] =  mat[0] * x + mat[4] * y + mat[8] * z + mat[12]
          vertices[k+1] = (mat[2] * x + mat[6] * y + mat[10] * z + mat[14]) * -1 //mat[1] * x + mat[5] * y + mat[9] * z + mat[13]
          vertices[k+2] = mat[1] * x + mat[5] * y + mat[9] * z + mat[13] //mat[2] * x + mat[6] * y + mat[10] * z + mat[14]
        }

        // Since all faces are triangles, we must add a `0` before each group of 3.
        let spcklFaces = [  ]
        for ( let i = 0; i < raw.indices.length; i++ ) {
          if( i % 3 === 0 ) 
            spcklFaces.push( 0 )
          spcklFaces.push( raw.indices[i] )
        }

        // Create a propper Speckle Mesh
        let spcklMesh =  {
          speckle_type: 'Objects.Geometry.Mesh',
          units: 'm',
          volume: 0,
          area: 0,
          faces: spcklFaces,
          vertices: Array.from( vertices ),
          renderMaterial: geom.color ? this.colorToMaterial( geom.color ) : null
        }
        // console.log( geom.material )
        // console.log( mesh.geometries.get( j ).color )

        
        let id = await this.objectSaver.saveObject( spcklMesh )
        let ref = { speckle_type: "reference", referencedId: id }
        this.productGeo[prodId].push( ref )
      }
    }
  }

  async traverse( element, recursive = true, depth = 0 ) {

    // Fast exit if null/undefined
    if ( !element ) return

    
    // If array, traverse all items in it.
    if( Array.isArray( element ) ) {
      return element.map( async el => await this.traverse( el,recursive, depth + 1 ) )
    }

    // If it has no expressID, its either a simple type or a { type, value } object. 
    if( !element.expressID ) {
      return element.value !== null && element.value !== undefined ? element.value : element
    }

    // If you got here -> It's an IFC Element: create base object, upload and return ref.
    // console.log( `Traversing element ${element.expressID}; Recurse: ${recursive}; Stack ${depth}` )

    // Traverse all key/value pairs first.
    for(let key of Object.keys( element )) {
      element[key] = await this.traverse( element[key], recursive, depth + 1 )
    }

    // Assign speckle_type and empty closure table.
    element.speckle_type = element.constructor.name
    element.__closure = {}

    // Find spatial children and assign to element
    const spatialChildrenIds = this.getAllRelatedItemsOfType( element.expressID, WebIFC.IFCRELAGGREGATES, 'RelatingObject', 'RelatedObjects' )
    if( spatialChildrenIds.length > 0 ) element.spatialChildren = spatialChildrenIds.map( ( childId ) => this.api.GetLine( this.modelId, childId, true ) )

    // Find children and populate element
    const childrenIds = this.getAllRelatedItemsOfType( element.expressID, WebIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE, 'RelatingStructure', 'RelatedElements' )
    if( childrenIds.length > 0 )  element.children = childrenIds.map( ( childId ) => this.api.GetLine( this.modelId, childId, true ) )

    // Lookup geometry in generated geometries object
    if( this.productGeo[element.expressID] ) {
      element['@displayValue'] = this.productGeo[element.expressID]
      this.productGeo[element.expressID].forEach( ref => {
        this.project.__closure[ref.referencedId.toString()] = depth 
        element.__closure[ref.referencedId.toString()] = 1
      })
      console.log( `${element.constructor.name} ${element.GlobalId}: display mesh count: ${this.productGeo[element.expressID].length}`)
    }

    // Recurse all children
    if ( recursive ) {

      if( element.spatialChildren ) {
        element.sc = []
        for(let child of element.spatialChildren) {
          let res = await this.traverse( child, recursive, depth + 1 )
          if( res.referencedId ) {
            element.sc.push( res )
            this.project.__closure[res.referencedId.toString()] = depth 
            element.__closure[res.referencedId.toString()] = 1
          }
        }
        delete element.spatialChildren
      }
      
      if ( element.children ) { 
        element.c = []
        for(let child of element.children) {
          let res = await this.traverse( child, recursive, depth + 1 ) 
          if( res.referencedId ) {
            element.c.push( res )
            this.project.__closure[res.referencedId.toString()] = depth 
            element.__closure[res.referencedId.toString()] = 1
          }
        }
        delete element.children
      }

      if( element.children || element.spatialChildren){
        console.log( `${element.constructor.name} ${element.GlobalId}: children count: ${ element.children ? element.children.length : '0'}; spatial children count: ${element.spatialChildren ? element.spatialChildren.length : '0'} `)
      }

    }

    // TODO: Detach and swap `element.expressID` for ref!
    // TOTHINK: i don't think we really need all of these tbh? (Partially)
    // A1: maybe only ones with the display values? (N)
    // A2: maybe only ones with the display values or spatial children or children? (Y)

    if( this.productGeo[element.expressID] || element.sc || element.c ) {
      let id = await this.objectSaver.saveObject( element )
      let ref = { speckle_type: "reference", referencedId: id }
      return ref 
    } else {
      return element
    }
  }


  // (c) https://github.com/agviegas/web-ifc-three
  extractVertexData(vertexData) {
    const vertices = []
    const normals = []
    let isNormalData = false
    for (let i = 0; i < vertexData.length; i++) {
        isNormalData ? normals.push(vertexData[i]) : vertices.push(vertexData[i])
        if ((i + 1) % 3 == 0) isNormalData = !isNormalData
    }
    return { vertices, normals }
  }

  // (c) https://github.com/agviegas/web-ifc-three/blob/907e08b5673d5e1c18261a4fceade7189d6b2db7/src/IFC/PropertyManager.ts#L110
  getAllRelatedItemsOfType( elementID, type, relation, relatedProperty ) {
    const lines = this.api.GetLineIDsWithType( this.modelId, type )
    const IDs = []

    for ( let i = 0; i < lines.size(); i++ ) {
      const relID = lines.get( i )
      const rel = this.api.GetLine( this.modelId, relID )
      const relatedItems = rel[relation]
      let foundElement = false

      if ( Array.isArray( relatedItems ) ) {
        const values = relatedItems.map( ( item ) => item.value )
        foundElement = values.includes( elementID )
      } else foundElement = ( relatedItems.value === elementID )

      if ( foundElement ) {
        const element = rel[relatedProperty]
        if ( !Array.isArray( element ) ) IDs.push( element.value )
        else element.forEach( ( ele ) => IDs.push( ele.value ) )
      }
    }

    return IDs
  }
  
  colorToMaterial( color ) {
    console.log( color )
  }

  /** Returns a ref object for the material given (r,g,b) values with an optional map for memoization. */
  colorToSpeckleMaterial( r,g,b, materialMap = {} ) {
    function rgba2int( r, g, b, a ) {
      if ( typeof r === 'string' && arguments.length === 1 ) {
        const [ r1, g1, b1, a1 ] = r
          .match( /^rgba?\((\d+\.?\d*)[,\s]*(\d+\.?\d*)[,\s]*(\d+\.?\d*)[,\s\/]*(.+)?\)$/ )
          .slice( 1 );
        [ r, g, b ] = [ r1, g1, b1 ].map( ( v ) => parseFloat( v ) )
        a = a1
          ? a1.endsWith( '%' )
            ? parseInt( a1.substring( 0, a1.length - 1 ), 10 ) / 100
            : parseFloat( a1 )
          : null
      }
      return a
        ? ( ( r & 0xff ) << 24 ) + ( ( g & 0xff ) << 16 ) + ( ( b & 0xff ) << 8 ) + ( Math.floor( a * 0xff ) & 0xff )
        : ( ( r & 0xff ) << 16 ) + ( ( g & 0xff ) << 8 ) + ( b & 0xff )
    }
    let intColor = rgba2int( r, g, b )
    if( materialMap[intColor] ) return materialMap[intColor]

    let material = {
      diffuse: intColor,
      opacity: 1,
      emissive: rgba2int( 0, 0, 0 ),
      metalness: 0,
      roughness: 1,
      speckle_type: 'Objects.Other.RenderMaterial'
    }

    // TODO: Detach and swap for ref object!
    let ref = material

    // Add ref to material map
    materialMap[intColor] = ref
    return ref
  }
}