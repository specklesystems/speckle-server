const WebIFC = require( 'web-ifc/web-ifc-api-node' )

module.exports = class IFCParser {
  constructor() {
    this.api = new WebIFC.IfcAPI()
  }

  async parse( data ) {
    if ( this.api.wasmModule === undefined ) await this.api.Init()

    this.modelId = this.api.OpenModel( data, { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true } )

    this.projectId = this.api.GetLineIDsWithType( this.modelId, WebIFC.IFCPROJECT ).get( 0 )

    this.project = this.api.GetLine( this.modelId, this.projectId )

    this.createGeometries()
    this.traverse( this.project )

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
        this.productGeo[prodId].push( {
          color: geom.color, // NOTE: material: x, y, z = rgb, w = opacity
          vertices: this.api.GetVertexArray( geom.GetVertexData(), geom.GetVertexDataSize() ),
          indices: this.api.GetIndexArray( geom.GetIndexData(), geom.GetIndexDataSize() )
        } )
      }
    }
  }

  traverse( element, recursive = true, depth = 0 ) {
    // NOTE: creates the base object. 
    // TODO: combine with alan's value unwrapping
    console.log( `Traversing element ${element.expressID}; Recurse: ${recursive}; Stack ${depth}` )
    depth++

    if ( !element ) return
    element.speckle_type = element.constructor.name
    const spatialChildrenIds = this.getAllRelatedItemsOfType( element.expressID, WebIFC.IFCRELAGGREGATES, 'RelatingObject', 'RelatedObjects' )

    element.spatialChildren = spatialChildrenIds.map( ( childId ) => this.api.GetLine( this.modelId, childId, false ) )

    const childrenIds = this.getAllRelatedItemsOfType( element.expressID, WebIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE, 'RelatingStructure', 'RelatedElements' )

    element.children = childrenIds.map( ( childId ) => this.api.GetLine( this.modelId, childId, false ) )

    // Lookup geometry in generated geometries object
    console.log( `${element.constructor.name} (${element.expressID}) mesh:`, this.productGeo[element.expressID]?.length )

    if ( recursive ) {
      element.spatialChildren.forEach( ( child ) => this.traverse( child, recursive, depth ) )
      // NOTE: unsure if this is needed.
      element.children.forEach( ( child ) => this.traverse( child, recursive, depth ) )
    }
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

  static unwrapValues( entity ) {
    const unwraped = {}
    Object.keys( entity ).forEach( ( key ) => {
      unwraped[key] = IFCParser.parseValue( entity[key] )
    } )

    return unwraped
  }

  static parseValue( entity ) {
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
