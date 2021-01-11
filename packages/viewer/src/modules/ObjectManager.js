import * as THREE from 'three'

export default class SceneObjectManager {

  constructor( viewer ) {
    this.viewer = viewer
    this.scene = viewer.scene
    this.userObjects = new THREE.Group()

    this.scene.add( this.userObjects )

    this.solidMaterial = new THREE.MeshLambertMaterial( { color: 0xA1ABB4, emissive: 0x0, side: THREE.DoubleSide } )
    this.objectIds = []

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
  }

  removeObject( id ) {
    // TODO
  }

  removeAllObjects() {
    this.userObjects.clear()
  }

  zoomToObject( id ) {

  }
  // see this discussion: https://github.com/mrdoob/three.js/pull/14526#issuecomment-497254491
  zoomExtents() {
    let bboxTarget = this.userObjects
    if ( this.userObjects.children.length === 0 ) bboxTarget = this.scene

    const box = new THREE.Box3().setFromObject( bboxTarget )
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

    this.viewer.controls.maxDistance = distance * 10
    this.viewer.controls.target.copy( center )

    this.viewer.camera.near = distance / 500
    this.viewer.camera.far = distance * 500
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
