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

    // Steps: create and store in speckle all the geometries (meshes) from this project and store them 
    // as reference objects in this.productGeo
    this.productGeo = {}
    await this.createGeometries()

    // Lastly, traverse the ifc project object and parse it into something friendly; as well as 
    // replace all its geometries with actual references to speckle meshes from the productGeo map
    let map = {}
    this.traverse( this.project, true, 0, map )
    
    return this.project
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
        
        let raw = {
          color: geom.color, // NOTE: material: x, y, z = rgb, w = opacity
          vertices: this.api.GetVertexArray( geom.GetVertexData(), geom.GetVertexDataSize() ),
          indices: this.api.GetIndexArray( geom.GetIndexData(), geom.GetIndexDataSize() )
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
          vertices: raw.vertices,
          renderMaterial: geom.color ? this.colorToSpeckleMaterial( geom.color.r, geom.color.g, geom.color.b, materialMap ) : undefined
        }
        
        //TODO: Send the mesh and swap for speckle ref
        let id = await this.objectSaver.saveObject( spcklMesh )
        let ref = spcklMesh

        this.productGeo[prodId].push( ref )
      }
    }
  }

  traverse( element, recursive = true, depth = 0, map = {} ) {

    // Fast exit if null/undefined
    if ( !element ) return

    depth++
    
    // If array, traverse all items in it.
    if( Array.isArray( element ) ) {
      return element.map( el => this.traverse( el,recursive,depth, map ) )
    }

    // If it has no expressID, its either a simple type or a { type, value } object. 
    if( !element.expressID ) {
      return element.value !== null && element.value !== undefined ? element.value : element
    }

    // If the expressID already exists in the map, return whatever is in there.
    if( map[element.expressID] ) {
      return map[element.expressID]
    }

    // If you got here -> It's an IFC Element: create base object, upload and return ref.
    // console.log( `Traversing element ${element.expressID}; Recurse: ${recursive}; Stack ${depth}` )

    // Traverse all key/value pairs first.
    Object.keys( element ).forEach( key => {
      element[key] = this.traverse( element[key], recursive, depth, map )
    } )

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
      element['@displayMesh'] = this.productGeo[element.expressID]
      // TODO: Add detached mesh to closure table.
    }

    // Recurse all children
    if ( recursive ) {
      if( element.spatialChildren ) element.spatialChildren.forEach( ( child ) => this.traverse( child, recursive, depth, map ) )
      // NOTE: unsure if this is needed.
      if ( element.children ) element.children.forEach( ( child ) => this.traverse( child, recursive, depth, map ) )
    }

    // TODO: Detach and swap `element.expressID` for ref!
    let ref = element.expressID

    // Create ref object with returned id, add it to the map and return the ref back.
    const refObject = { referenceId: ref, speckle_type: 'reference' }
    map[element.expressID] = refObject
    return refObject
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