const WebIFC = require( 'web-ifc/web-ifc-api-node' )
const ServerAPI = require( './api.js' )

module.exports = class IFCParser {
  
  constructor( { serverApi } ) {
    this.api = new WebIFC.IfcAPI()
    this.serverApi = serverApi || new ServerAPI()
  }

  async parse( data ) {
    if ( this.api.wasmModule === undefined ) await this.api.Init()

    this.modelId = this.api.OpenModel( data, { COORDINATE_TO_ORIGIN: true, USE_FAST_BOOLS: true } )

    this.projectId = this.api.GetLineIDsWithType( this.modelId, WebIFC.IFCPROJECT ).get( 0 )

    this.project = this.api.GetLine( this.modelId, this.projectId, true )
    this.project.__closure = {}
    
    this.cache = {}
    this.closureCache = {}

    // Steps: create and store in speckle all the geometries (meshes) from this project and store them 
    // as reference objects in this.productGeo
    this.productGeo = {}
    await this.createGeometries()    
    console.log( `Geometries created: ${Object.keys( this.productGeo ).length} meshes.` )
    
    // Lastly, traverse the ifc project object and parse it into something friendly; as well as 
    // replace all its geometries with actual references to speckle meshes from the productGeo map
    
    await this.traverse( this.project, true, 0 )
    
    let id = await this.serverApi.saveObject( this.project )
    return { id, tCount: Object.keys( this.project.__closure ).length }
  }

  async createGeometries() {
    this.rawGeo = this.api.LoadAllGeometry( this.modelId )
    
    for( let i = 0; i < this.rawGeo.size(); i++ ) {
      const mesh = this.rawGeo.get( i )
      const prodId = mesh.expressID
      this.productGeo[prodId ] = []
      
      for( let j = 0; j < mesh.geometries.size(); j++ ) {
        let placedGeom = mesh.geometries.get( j )
        let geom = this.api.GetGeometry( this.modelId, placedGeom.geometryExpressID )

        let matrix = placedGeom.flatTransformation 
        let raw = {
          color: geom.color, // NOTE: material: x, y, z = rgb, w = opacity
          vertices: this.api.GetVertexArray( geom.GetVertexData(), geom.GetVertexDataSize() ),
          indices: this.api.GetIndexArray( geom.GetIndexData(), geom.GetIndexDataSize() )
        }
        
        const { vertices } = this.extractVertexData( raw.vertices )

        for( let k = 0; k < vertices.length; k += 3 ) {
          let x = vertices[k], y = vertices[k + 1], z = vertices[k + 2]
          vertices[k] =  matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12]
          vertices[k + 1] = ( matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14] ) * -1 
          vertices[k + 2] = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13]
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
          renderMaterial: placedGeom.color ? this.colorToMaterial( placedGeom.color ) : null
        }
        
        let id = await this.serverApi.saveObject( spcklMesh )
        let ref = { speckle_type: 'reference', referencedId: id }
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

    if( this.cache[element.expressID.toString()] ) return this.cache[element.expressID.toString()]
    // If you got here -> It's an IFC Element: create base object, upload and return ref.
    // console.log( `Traversing element ${element.expressID}; Recurse: ${recursive}; Stack ${depth}` )

    // Traverse all key/value pairs first.
    for( let key of Object.keys( element ) ) {
      element[key] = await this.traverse( element[key], recursive, depth + 1 )
    }

    // Assign speckle_type and empty closure table.
    element.speckle_type = element.constructor.name
    element.__closure = {}

    // Find spatial children and assign to element
    const spatialChildrenIds = this.getAllRelatedItemsOfType( element.expressID, WebIFC.IFCRELAGGREGATES, 'RelatingObject', 'RelatedObjects' )
    if( spatialChildrenIds.length > 0 ) element.rawSpatialChildren = spatialChildrenIds.map( ( childId ) => this.api.GetLine( this.modelId, childId, true ) )

    // Find children and populate element
    const childrenIds = this.getAllRelatedItemsOfType( element.expressID, WebIFC.IFCRELCONTAINEDINSPATIALSTRUCTURE, 'RelatingStructure', 'RelatedElements' )
    if( childrenIds.length > 0 )  element.rawChildren = childrenIds.map( ( childId ) => this.api.GetLine( this.modelId, childId, true ) )

    // Lookup geometry in generated geometries object
    if( this.productGeo[element.expressID] ) {
      element['@displayValue'] = this.productGeo[element.expressID]
      this.productGeo[element.expressID].forEach( ref => {
        this.project.__closure[ref.referencedId.toString()] = depth 
        element.__closure[ref.referencedId.toString()] = 1
      } )
    }

    // Recurse all children
    if ( recursive ) {

      if( element.rawSpatialChildren ) {
        element.spatialChildren = []
        for( let child of element.rawSpatialChildren ) {
          let res = await this.traverse( child, recursive, depth + 1 )
          if( res.referencedId ) {
            element.spatialChildren.push( res )
            this.project.__closure[res.referencedId.toString()] = depth 
            element.__closure[res.referencedId.toString()] = 1
            
            // adds to parent (this element) the child's closure tree.
            if( this.closureCache[child.expressID.toString()] ) {
              for( let key of Object.keys( this.closureCache[child.expressID.toString()] ) ) {
                element.__closure[key] = this.closureCache[child.expressID.toString()][key] + 1
              }
            }
          }
        }
        delete element.rawSpatialChildren
      }
      
      if ( element.rawChildren ) { 
        element.children = []
        for( let child of element.rawChildren ) {
          let res = await this.traverse( child, recursive, depth + 1 ) 
          if( res.referencedId ) {
            element.children.push( res )
            this.project.__closure[res.referencedId.toString()] = depth 
            element.__closure[res.referencedId.toString()] = 1

            // adds to parent (this element) the child's closure tree.
            if( this.closureCache[child.expressID.toString()] ) {
              for( let key of Object.keys( this.closureCache[child.expressID.toString()] ) ) {
                element.__closure[key] = this.closureCache[child.expressID.toString()][key] + 1
              }
            }
          }
        }
        delete element.rawChildren
      }

      if( element.children || element.spatialChildren ) {
        console.log( `${element.constructor.name} ${element.GlobalId}: children count: ${ element.children ? element.children.length : '0'}; spatial children count: ${element.spatialChildren ? element.spatialChildren.length : '0'} ` )
      }

    }

    if( this.productGeo[element.expressID] || element.spatialChildren || element.children ) {
      let id = await this.serverApi.saveObject( element )
      let ref = { speckle_type: 'reference', referencedId: id }
      this.cache[element.expressID.toString()] = ref
      this.closureCache[element.expressID.toString()] = element.__closure
      return ref 
    } else {
      this.cache[element.expressID.toString()] = element
      this.closureCache[element.expressID.toString()] = element.__closure
      return element
    }
  }


  // (c) https://github.com/agviegas/web-ifc-three
  extractVertexData( vertexData ) {
    const vertices = []
    const normals = []
    let isNormalData = false
    for ( let i = 0; i < vertexData.length; i++ ) {
        isNormalData ? normals.push( vertexData[i] ) : vertices.push( vertexData[i] )
        if ( ( i + 1 ) % 3 === 0 ) isNormalData = !isNormalData
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
    let intColor = ( color.w << 24 ) + ( ( color.x * 255 ) << 16 ) + ( ( color.y * 255 ) << 8 ) + ( ( color.z * 255 ) )
    
    return {
      diffuse: intColor,
      opacity: color.w,
      metalness: 0,
      roughness: 1,
      speckle_type: 'Objects.Other.RenderMaterial'
    }
  }
}