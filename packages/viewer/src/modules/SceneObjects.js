import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils'
import debounce from 'lodash.debounce'
import { filterAndColorObject } from './Filtering'

/**
 * Container for the scene objects, to allow loading/unloading/filtering/coloring/grouping
 */
export default class SceneObjects {

  constructor( viewer ) {
    this.viewer = viewer
    this.scene = viewer.scene

    this.allObjects = new THREE.Group()
    this.allSolidObjects = new THREE.Group()
    this.allTransparentObjects = new THREE.Group()
    this.allLineObjects = new THREE.Group()
    this.allPointObjects = new THREE.Group()
    this.allObjects.add( this.allSolidObjects )
    this.allObjects.add( this.allTransparentObjects )
    this.allObjects.add( this.allLineObjects )
    this.allObjects.add( this.allPointObjects )

    this.filteredObjects = new THREE.Group()
    this.filteredSolidObjects = new THREE.Group()
    this.filteredTransparentObjects = new THREE.Group()
    this.filteredLineObjects = new THREE.Group()
    this.filteredPointObjects = new THREE.Group()
    this.filteredObjects.add( this.filteredSolidObjects )
    this.filteredObjects.add( this.filteredTransparentObjects )
    this.filteredObjects.add( this.filteredLineObjects )
    this.filteredObjects.add( this.filteredPointObjects )


    this.groupedSolidObjects = new THREE.Group()

    this.filteredObjects.add( this.groupedSolidObjects )

    this.scene.add( this.allObjects )
    this.scene.add( this.filteredObjects )

    this.appliedFilter = null
  }

  setFilteredView() {
    this.scene.remove( this.allObjects )
    this.applyFilter()
  }

  applyFilter( filter ) {
    // eslint-disable-next-line no-param-reassign
    if ( filter === undefined ) filter = this.appliedFilter
    this.appliedFilter = filter

    this.filteredSolidObjects.clear()
    for ( let obj of this.allSolidObjects.children ) {
      let filteredObj = filterAndColorObject( obj, filter )
      if ( filteredObj )
        this.filteredSolidObjects.add( filteredObj )
    }

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

    this._groupObjects()

    this.viewer.needsRender = true
  }

  _groupObjects() {
    let materialIdToBufferGeometry = {}
    let materialIdToMaterial = {}

    for ( let mesh of this.filteredSolidObjects.children ) {
      let m = mesh.material
      let materialId = `${m.type}/${m.vertexColors}/${m.color.toJSON()}/${m.side}/${m.transparent}/${m.opactiy}/${m.emissive}/${m.metalness}/${m.roughness}`

      if ( !( materialId in materialIdToBufferGeometry ) ) {
        materialIdToBufferGeometry[ materialId ] = []
        materialIdToMaterial[ materialId ] = m
      }

      materialIdToBufferGeometry[ materialId ].push( mesh.geometry )
    }

    this.groupedSolidObjects.clear()
    
    for ( let solidObj of this.filteredSolidObjects.children ) {
      solidObj.visible = false
    }

    for ( let materialId in materialIdToBufferGeometry ) {
      // TODO: does this handle transforms well ?
      let groupGeometry = BufferGeometryUtils.mergeBufferGeometries( materialIdToBufferGeometry[ materialId ] )
      let groupMaterial = materialIdToMaterial[ materialId ]
      let groupMesh = new THREE.Mesh( groupGeometry, groupMaterial )
      groupMesh.visible = 
      this.groupedSolidObjects.add( groupMesh )
    }
  }

}
