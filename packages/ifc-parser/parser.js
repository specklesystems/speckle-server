const WebIFC = require( 'web-ifc/web-ifc-api-node' )

module.exports = class IFCParser {
  constructor() {
    this.api = new WebIFC.IfcAPI()
  }

  async parse( data ) {
    if ( this.api.wasmModule === undefined ) await this.api.Init()

    this.modelId = this.api.OpenModel( data, { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true } )

    this.projectId = this.api.GetLineIDsWithType( this.modelId, WebIFC.IFCPROJECT ).get( 0 )

    this.project = this.api.GetLine( this.modelId, this.projectId, true )

    this.createGeometries()
    let map = {}
    this.traverse( this.project, true, 0, map )
    
    return this.project
  }

  createGeometries() {
    // TODO: this is where we can alreadt create speckle meshes and plop them in the db.
    this.rawGeo = this.api.LoadAllGeometry( this.modelId )
    this.productGeo = {}
    for( let i = 0; i < this.rawGeo.size(); i++ ) {
      const mesh = this.rawGeo.get( i )
      const prodId = mesh.expressID
      this.productGeo[prodId ] = []
      
      for( let j = 0; j < mesh.geometries.size(); j++ ) {
        let geom = this.api.GetGeometry( this.modelId, mesh.geometries.get( j ).geometryExpressID )

        // TODO: actually create Speckle Mesh

        let raw = {
          color: geom.color, // NOTE: material: x, y, z = rgb, w = opacity
          vertices: this.api.GetVertexArray( geom.GetVertexData(), geom.GetVertexDataSize() ),
          indices: this.api.GetIndexArray( geom.GetIndexData(), geom.GetIndexDataSize() )
        }

        let spcklFaces = [  ]
        for ( let i = 0; i < raw.indices.length; i++ ) {
          if( i % 3 === 0 ) 
            spcklFaces.push( 0 )
          spcklFaces.push( raw.indices[i] )
          
        }
        let spcklMesh =  {
          speckle_type: 'Objects.Geometry.Mesh',
          units: 'm',
          volume: 0,
          area: 0,
          faces: spcklFaces,
          vertices: raw.vertices,
          renderMaterial: geom.color ? colorToSpeckleMaterial( geom.color.r, geom.colr.g, geom.color.b ) : undefined
        }
        
        // Send the mesh and swap for speckle ref
        this.productGeo[prodId].push( spcklMesh )
      }
    }
  }

  traverse( element, recursive = true, depth = 0, map = {} ) {
    // NOTE: creates the base object. 
    // TODO: combine with alan's value unwrapping
    if ( !element ) return
    depth++
    
    if( Array.isArray( element ) ) {
      return element.map( el => this.traverse( el,recursive,depth, map ) )
    }

    if( !element.expressID ) {
      return element.value !== null && element.value !== undefined ? element.value : element
    }

    if( map[element.expressID] ) {
      return map[element.expressID]
    }

    // It's an IFC Element, do the thing...
    console.log( `Traversing element ${element.expressID}; Recurse: ${recursive}; Stack ${depth}` )

    // Iterate through existing keys first.
    Object.keys( element ).forEach( key => {
      element[key] = this.traverse( element[key], recursive, depth, map )
    } )

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

    // TODO: Detach and swap for ref!
    map[element.expressID] = { referenceId: element.expressID, speckle_type: 'reference' }
    
    // Return the modified element.
    return element
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

  unwrapValues( entity ) {
    Object.keys( entity ).forEach( ( key ) => {
      entity[key] = this.parseValue( entity[key] )
    } )
  }
  
  parseValue( entity ) {
    // NOTE: This method does not deal with references (type=5), they are handled in the traverse logic to keep track of depth properly.
    if ( !entity ) return
    // NOTE: this stands in for an express reference. 
    if ( entity.value && entity.type !== 5 ) {
      return entity.value
    }

    if ( Array.isArray( entity ) ) {
      const returnValue = entity.map( ( ent ) => IFCParser.unwrapValues( ent ) )
      return returnValue
    }

    if ( typeof entity === 'object' ) {
      const returnValue = {}
      Object.assign( returnValue, entity )
      returnValue.speckle_type = 'Base'

      return returnValue
    }

    return entity
  }
}



function colorToSpeckleMaterial( r,g,b ) {
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

  return {
    diffuse: rgba2int( r, g, b ),
    opacity: 1,
    emissive: rgba2int( 0, 0, 0 ),
    metalness: 0,
    roughness: 1,
    speckle_type: 'Objects.Other.RenderMaterial'
  }
}
