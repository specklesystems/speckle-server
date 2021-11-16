import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'
import FilteringManager from './FilteringManager'

/**
 * Container for the scene objects, to allow loading/unloading/filtering/coloring/grouping
 */
export default class SceneObjects {

  constructor( viewer ) {
    this.viewer = viewer
    this.scene = viewer.scene

    this.allObjects = new THREE.Group()
    this.allObjects.name = 'allObjects'
    
    this.allSolidObjects = new THREE.Group()
    this.allSolidObjects.name = 'allSolidObjects'
    this.allSolidObjects.visible = false // these are grouped later, we never want to display them individually
    this.allObjects.add( this.allSolidObjects )
    
    this.allTransparentObjects = new THREE.Group()
    this.allTransparentObjects.name = 'allTransparentObjects'
    this.allObjects.add( this.allTransparentObjects )
    
    this.allLineObjects = new THREE.Group()
    this.allLineObjects.name = 'allLineObjects'
    this.allObjects.add( this.allLineObjects )
    
    this.allPointObjects = new THREE.Group()
    this.allPointObjects.name = 'allPointObjects'
    this.allObjects.add( this.allPointObjects )

    // Grouped solid objects, generated from `allSolidObjects`
    this.groupedSolidObjects = new THREE.Group()
    this.groupedSolidObjects.name = 'groupedSolidObjects'
    this.allObjects.add( this.groupedSolidObjects )

    this.filteringManager = new FilteringManager( this.viewer )
    this.filteredObjects = null

    this.appliedFilter = null

    // When the `appliedFilter` is null, scene will contain `allObjects`. Otherwise, `filteredObjects`
    // This is to optimize the no-filter usecase, so we don't make an unnecessary clone of all the objects
    this.objectsInScene = this.allObjects
    this.scene.add( this.allObjects )

    this.isBusy = true
    this.lastAsyncPause = Date.now()
  }

  async asyncPause() {
    // Don't freeze the UI when doing all those traversals
    if ( Date.now() - this.lastAsyncPause >= 100 ) {
      // if (Date.now() - this.lastAsyncPause > 200 ) console.log("FREEZED for ", Date.now() - this.lastAsyncPause)
      await new Promise( resolve => setTimeout( resolve, 0 ) )
      this.lastAsyncPause = Date.now()
    }
  }

  getObjectsProperties() {
    let flattenObject = function( obj ) {
      let flatten = {}
      for ( let k in obj ) {
        if ( [ 'id', '__closure', 'bbox', 'totalChildrenCount' ].includes( k ) )
          continue
        let v = obj[ k ]
        if ( Array.isArray( v ) )
          continue
        if ( v.constructor === Object ) {
          let flattenProp = flattenObject( v )
          for ( let pk in flattenProp ) {
            flatten[ `${k}.${pk}` ] = flattenProp[ pk ]
          }
          continue
        }
        if ( [ 'string', 'number', 'boolean' ].includes( typeof v ) )
          flatten[ k ] = v
      }
      return flatten
    }

    let propValues = {}
    for ( let objGroup of this.objectsInScene.children ) {
      for ( let threeObj of objGroup.children ) {
        let obj = flattenObject( threeObj.userData )
        for ( let prop of Object.keys( obj ) ) {
          if ( !( prop in propValues ) ) {
            propValues[ prop ] = []
          }
          propValues[ prop ].push( obj[ prop ] )
        }
      }
    }

    let propInfo = {}
    for ( let prop in propValues ) {
      let pinfo = {
        type: typeof propValues[ prop ][ 0 ],
        objectCount: propValues[ prop ].length,
        allValues: propValues[ prop ],
        uniqueValues: {},
        minValue: propValues[ prop ][ 0 ],
        maxValue: propValues[ prop ][ 0 ]
      }
      for ( let v of propValues[ prop ] ) {
        if ( v < pinfo.minValue ) pinfo.minValue = v
        if ( v > pinfo.maxValue ) pinfo.maxValue = v
        if ( !( v in pinfo.uniqueValues ) ) {
          pinfo.uniqueValues[ v ] = 0
        }
        pinfo.uniqueValues[ v ] += 1
      }

      propInfo[ prop ] = pinfo
    }
    return propInfo
  }

  async applyFilterToGroup( threejsGroup, filter ) {
    let ret = new THREE.Group()
    ret.name = 'filtered_' + threejsGroup.name

    for ( let obj of threejsGroup.children ) {
      await this.asyncPause()
      let filteredObj = this.filteringManager.filterAndColorObject( obj, filter )
      if ( filteredObj )
        ret.add( filteredObj )
    }
    return ret
  }

  disposeAndClearGroup( threejsGroup, disposeGeometry = true ) {
    let t0 = Date.now()
    for ( let child of threejsGroup.children ) {
      if ( child.type === 'Group' ) {
        this.disposeAndClearGroup( child, disposeGeometry )
      }
      if ( child.material )
        child.material.dispose()
      if ( disposeGeometry && child.geometry )
        child.geometry.dispose()
    }
    threejsGroup.clear()
    // console.log( 'Dispose in: ', Date.now() - t0 )
  }

  async applyFilter( filter ) {
    // eslint-disable-next-line no-param-reassign
    if ( filter === undefined ) filter = this.appliedFilter
    
    if ( filter === null ) {
      // Remove filters, use allObjects
      let newGoupedSolidObjects = await this.groupSolidObjects( this.allSolidObjects )
      if ( this.groupedSolidObjects !== null ) {
        this.disposeAndClearGroup( this.groupedSolidObjects )
        this.allObjects.remove( this.groupedSolidObjects )
      }
      this.groupedSolidObjects = newGoupedSolidObjects
      this.allObjects.add( this.groupedSolidObjects )

      if ( this.filteredObjects !== null ) {
        this.disposeAndClearGroup( this.filteredObjects )
        this.filteredObjects = null
      }
      this.scene.remove( this.objectsInScene )
      this.scene.add( this.allObjects )
      this.objectsInScene = this.allObjects
    } else {
      // A filter is to be applied
      this.filteringManager.initFilterOperation()

      let newFilteredObjects = new THREE.Group()
      newFilteredObjects.name = 'FilteredObjects'
  
      let filteredSolidObjects = await this.applyFilterToGroup( this.allSolidObjects, filter )
      filteredSolidObjects.visible = false
      newFilteredObjects.add( filteredSolidObjects )
  
      let filteredLineObjects = await this.applyFilterToGroup( this.allLineObjects, filter )
      newFilteredObjects.add( filteredLineObjects )
  
      let filteredTransparentObjects = await this.applyFilterToGroup( this.allTransparentObjects, filter )
      newFilteredObjects.add( filteredTransparentObjects )
  
      let filteredPointObjects = await this.applyFilterToGroup( this.allPointObjects, filter )
      newFilteredObjects.add( filteredPointObjects )
      
      // group solid objects
      let groupedFilteredSolidObjects = await this.groupSolidObjects( filteredSolidObjects )
      newFilteredObjects.add( groupedFilteredSolidObjects )

      // Sync update scene
      if ( this.filteredObjects !== null ) {
        this.disposeAndClearGroup( this.filteredObjects )
      }
      this.filteredObjects = newFilteredObjects

      this.scene.remove( this.objectsInScene )
      this.scene.add( this.filteredObjects )
      this.objectsInScene = this.filteredObjects
    }

    this.appliedFilter = filter
    this.viewer.needsRender = true


    return { colorLegend: this.filteringManager.colorLegend }
  }

  flattenGroup( group ) {
    let acc = []
    for( let child of group.children ) {
      if( child instanceof THREE.Group ) {
        acc.push( ...this.flattenGroup( child ) )
        
      } else {
        acc.push( child.clone() )
      }
    }
    for( let element of acc ) { 
      element.geometry = element.geometry.clone()
      element.geometry.applyMatrix4( group.matrix )
    }
    return acc
  }

  async groupSolidObjects( threejsGroup ) {
    let materialIdToBufferGeometry = {}
    let materialIdToMaterial = {}
    let materialIdToMeshes = {}

    for ( let obj of threejsGroup.children ) {
      let meshes = []
      if( obj instanceof THREE.Group ) {    
        meshes = this.flattenGroup( obj )

      } else {
        meshes = [ obj ]
      }

      for( let mesh of meshes ) {
        let m = mesh.material
        let materialId = `${m.type}/${m.vertexColors}/${m.color.toJSON()}/${m.side}/${m.transparent}/${m.opactiy}/${m.emissive}/${m.metalness}/${m.roughness}`

        if ( !( materialId in materialIdToBufferGeometry ) ) {
          materialIdToBufferGeometry[ materialId ] = []
          materialIdToMaterial[ materialId ] = m
          materialIdToMeshes[ materialId ] = []
        }

        materialIdToBufferGeometry[ materialId ].push( mesh.geometry )
        materialIdToMeshes[ materialId ].push( mesh )

        // Max 1024 objects per group (mergeBufferGeometries is sync and can freeze for large data)
        if ( materialIdToBufferGeometry[ materialId ].length >= 1024 ) {
          let archivedMaterialId = `arch//${materialId}//${mesh.id}`
          materialIdToBufferGeometry[ archivedMaterialId ] = materialIdToBufferGeometry[ materialId ]
          materialIdToMaterial[ archivedMaterialId ] = materialIdToMaterial[ materialId ]
          materialIdToMeshes[ archivedMaterialId ] = materialIdToMeshes[ materialId ]
          delete materialIdToBufferGeometry[ materialId ]
          delete materialIdToMaterial[ materialId ]
          delete materialIdToMeshes[ materialId ]
        }
      }
    }
    
    
    let groupedObjects = new THREE.Group()
    groupedObjects.name = 'GroupedSolidObjects'

    await this.asyncPause()

    for ( let materialId in materialIdToBufferGeometry ) {
      await this.asyncPause()
      // TODO: does this handle transforms well ?
      let groupGeometry = BufferGeometryUtils.mergeBufferGeometries( materialIdToBufferGeometry[ materialId ] )
      await this.asyncPause()
      let groupMaterial = materialIdToMaterial[ materialId ]
      let groupMesh = new THREE.Mesh( groupGeometry, groupMaterial )
      groupMesh.userData = null
      groupedObjects.add( groupMesh )
    }

    return groupedObjects
  }

}
