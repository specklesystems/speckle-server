import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'
import debounce from 'lodash.debounce'
import { filterAndColorObject } from './Filtering'

/**
 * Container for the scene objects, to allow loading/unloading/filtering/coloring/grouping
 */
export default class SceneObjects {

  constructor( viewer ) {
    this.isInitialLoading = true

    this.viewer = viewer
    this.scene = viewer.scene

    this.allObjects = new THREE.Group()
    this.allObjects.name = 'allObjects'
    this.allSolidObjects = new THREE.Group()
    this.allSolidObjects.name = 'allSolidObjects'
    this.allTransparentObjects = new THREE.Group()
    this.allTransparentObjects.name = 'allTransparentObjects'
    this.allLineObjects = new THREE.Group()
    this.allLineObjects.name = 'allLineObjects'
    this.allPointObjects = new THREE.Group()
    this.allPointObjects.name = 'allPointObjects'
    this.allObjects.add( this.allSolidObjects )
    this.allObjects.add( this.allTransparentObjects )
    this.allObjects.add( this.allLineObjects )
    this.allObjects.add( this.allPointObjects )

    this.filteredObjects = new THREE.Group()
    this.filteredObjects.name = 'filteredObjects'
    this.filteredSolidObjects = new THREE.Group()
    this.filteredSolidObjects.name = 'filteredSolidObjects'
    this.filteredTransparentObjects = new THREE.Group()
    this.filteredTransparentObjects.name = 'filteredTransparentObjects'
    this.filteredLineObjects = new THREE.Group()
    this.filteredLineObjects.name = 'filteredLineObjects'
    this.filteredPointObjects = new THREE.Group()
    this.filteredPointObjects.name = 'filteredPointObjects'
    this.filteredObjects.add( this.filteredSolidObjects )
    this.filteredObjects.add( this.filteredTransparentObjects )
    this.filteredObjects.add( this.filteredLineObjects )
    this.filteredObjects.add( this.filteredPointObjects )


    this.groupedSolidObjects = new THREE.Group()
    this.groupedSolidObjects.name = 'groupedSolidObjects'

    this.filteredObjects.add( this.groupedSolidObjects )

    this.scene.add( this.allObjects )

    this.appliedFilter = null

    this.lastAsyncPause = Date.now()
  }

  async asyncPause() {
    // Don't freeze the UI when doing all those traversals
    if ( Date.now() - this.lastAsyncPause >= 30 ) {
      if (Date.now() - this.lastAsyncPause > 50 ) console.log("FREEZED for ", Date.now() - this.lastAsyncPause)
      await new Promise( resolve => setTimeout( resolve, 0 ) )
      this.lastAsyncPause = Date.now()
    }
  }

  async setFilteredView() {
    if ( !this.isInitialLoading ) {
      await this.applyFilter()
      return
    }

    this.isInitialLoading = false
    await this.applyFilter()
    this.scene.add( this.filteredObjects )
    this.scene.remove( this.allObjects )
  }

  async applyFilterToObjects( objectArray, filter, targetGroup ) {
    for ( let i = 0; i < objectArray.length; i++ ) {
      if ( i % 100 === 0 ) await this.asyncPause()

      let filteredObj = filterAndColorObject( objectArray[ i ], filter )
      if ( filteredObj )
        targetGroup.add( filteredObj )
    }
  }

  disposeAndClearGroup( threejsGroup, disposeGeometry = false ) {
    let t0 = Date.now()
    for ( let child of threejsGroup.children ) {
      if ( child.material )
        child.material.dispose()
      else
        fdsfs()
      if ( disposeGeometry && child.geometry )
        child.geometry.dispose()
    }
    threejsGroup.clear()
    console.log("Dispose in: ", Date.now() - t0)
  }

  async applyFilter( filter, disposeGeometry = false ) {
    // eslint-disable-next-line no-param-reassign
    if ( filter === undefined ) filter = this.appliedFilter
    this.appliedFilter = filter
    
    this.lastAsyncPause = Date.now()

    // this.filteredSolidObjects.clear()
    this.disposeAndClearGroup( this.filteredSolidObjects, disposeGeometry )
    await this.applyFilterToObjects( this.allSolidObjects.children, filter, this.filteredSolidObjects )

    // for ( let obj of this.allSolidObjects.children ) {
    //   let filteredObj = filterAndColorObject( obj, filter )
    //   if ( filteredObj )
    //     this.filteredSolidObjects.add( filteredObj )
    // }

    this.filteredTransparentObjects.clear()
    for ( let obj of this.allTransparentObjects.children ) {
      let filteredObj = filterAndColorObject( obj, filter )
      if ( filteredObj )
        this.filteredTransparentObjects.add( filteredObj )
    }

    this.filteredLineObjects.clear()
    for ( let obj of this.allLineObjects.children ) {
      let filteredObj = filterAndColorObject( obj, filter )
      if ( filteredObj )
        this.filteredLineObjects.add( filteredObj )
    }

    this.filteredPointObjects.clear()
    for ( let obj of this.allPointObjects.children ) {
      let filteredObj = filterAndColorObject( obj, filter )
      if ( filteredObj )
        this.filteredPointObjects.add( filteredObj )
    }

    await this._groupObjects()

    this.viewer.needsRender = true
  }

  async _groupObjects() {
    let materialIdToBufferGeometry = {}
    let materialIdToMaterial = {}
    let materialIdToMeshes = {}

    for ( let mesh of this.filteredSolidObjects.children ) {
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
    
    await this.asyncPause()

    this.disposeAndClearGroup( this.groupedSolidObjects, true )
    
    for ( let materialId in materialIdToBufferGeometry ) {
      await this.asyncPause()
      // TODO: does this handle transforms well ?
      let groupGeometry = BufferGeometryUtils.mergeBufferGeometries( materialIdToBufferGeometry[ materialId ] )
      await this.asyncPause()
      let groupMaterial = materialIdToMaterial[ materialId ]
      let groupMesh = new THREE.Mesh( groupGeometry, groupMaterial )
      this.groupedSolidObjects.add( groupMesh )
      for ( let mesh of materialIdToMeshes[ materialId ] ) {
        mesh.visible = false
      }
    }

  }

}
