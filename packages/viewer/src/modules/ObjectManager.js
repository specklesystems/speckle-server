import * as THREE from 'three'
import debounce from 'lodash.debounce'

export default class SceneObjectManager {

  constructor( viewer ) {
    this.viewer = viewer
    this.scene = viewer.scene
    this.userObjects = new THREE.Group()

    this.scene.add( this.userObjects )

    this.solidMaterial = new THREE.MeshStandardMaterial( { color: 0xA0A4A8, emissive: 0x0, roughness: 0.6, metalness: 0.2, side: THREE.DoubleSide } )
    this.objectIds = []

    this.zoomExtentsDebounce = debounce( () => { this.zoomExtents() }, 200 )
  }

  addObject( wrapper ) {
    switch ( wrapper.geometryType ) {
    case 'solid':
      this.addSolid( wrapper )
      break
    case 'line':
      this.addLine( wrapper )
      break
    case 'point':
      this.addPoint( wrapper )
      break
    }

    this.zoomExtentsDebounce()
  }

  removeObject( id ) {
    let obj = this.userObjects.children.find( o => o.uuid === id )
    if ( obj ){
      obj.geometry.dispose()
      this.userObjects.remove( obj )
    } else {
      console.warn( `Failed to remove object with id: ${id}: no object found.` )
    }
  }

  removeAllObjects() {
    for ( let obj of this.userObjects.children ) {
      if ( obj.geometry ){
        obj.geometry.dispose()
      }
    }
    this.userObjects.clear()
    this.objectIds = []
  }

  zoomToObject( target ) {
    const box = new THREE.Box3().setFromObject( target )
    this.zoomToBox( box )
  }

  zoomExtents() {
    let bboxTarget = this.userObjects
    if ( this.userObjects.children.length === 0 ) bboxTarget = this.scene

    const box = new THREE.Box3().setFromObject( bboxTarget )
    this.zoomToBox( box )
  }

  // see this discussion: https://github.com/mrdoob/three.js/pull/14526#issuecomment-497254491
  zoomToBox( box ) {
    const fitOffset = 1.2

    const size = box.getSize( new THREE.Vector3() )
    const center = box.getCenter( new THREE.Vector3() )

    const maxSize = Math.max( size.x, size.y, size.z )
    const fitHeightDistance = maxSize / ( 2 * Math.atan( Math.PI * this.viewer.camera.fov / 360 ) )
    const fitWidthDistance = fitHeightDistance / this.viewer.camera.aspect
    const distance = fitOffset * Math.max( fitHeightDistance, fitWidthDistance )

    const direction = this.viewer.controls.target.clone()
      .sub( this.viewer.camera.position )
      .normalize()
      .multiplyScalar( distance )

    // this.viewer.controls.maxDistance = distance * 20
    this.viewer.controls.target.copy( center )

    this.viewer.camera.near = distance / 100
    this.viewer.camera.far = distance * 100
    this.viewer.camera.updateProjectionMatrix()

    this.viewer.camera.position.copy( this.viewer.controls.target ).sub( direction )

    this.viewer.controls.update()
  }


  addSolid( wrapper ) {
    // TODO: check on wrapper.meta.material and switch to either
    // - shiny solid
    // - transparent solid
    const mesh = new THREE.Mesh( wrapper.bufferGeometry, this.solidMaterial )
    mesh.userData = wrapper.meta
    mesh.uuid = wrapper.meta.id
    this.objectIds.push( mesh.uuid )
    this.userObjects.add( mesh )
  }

  addShinySolid( wrapper ) {
    // TODO
  }

  addTransparentSolid( wrapper ) {
    // TODO
  }

  addLine( wrapper ) {
    // TODO
  }

  addPoint( wrapper ){
    // TODO
  }

}
