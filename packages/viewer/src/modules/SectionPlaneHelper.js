import * as THREE from 'three'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'

/**
 * WIP: A utility class for adding section planes to the scene.
 * - 'S' shows/hides section planes
 * - 's' toggles controls from translate to rotate
 */
export default class SectionPlaneHelper {

  constructor( parent ) {
    this.viewer = parent
    this.cutters = []
    this.visible = false

    window.addEventListener( 'keydown', ( event ) => {
      if ( event.key === 's' ) {
        this.toggleTransformControls()
      }
      if ( event.key === 'S' ) {
        this.toggleSectionPlanes()
      }
    }, false )
  }

  get planes() {
    return this.cutters.map( cutter => cutter.plane )
  }

  get activePlanes() {
    return this.cutters.filter( cutter => cutter.visible ).map( cutter => cutter.plane )
  }

  toggleTransformControls() {
    this.cutters.forEach( cutter => {
      if ( cutter.control.mode === 'rotate' ) {
        cutter.control.setMode( 'translate' )
        cutter.control.showX = false
        cutter.control.showY = false
        cutter.control.showZ = true
        return
      }
      cutter.control.setMode( 'rotate' )
      cutter.control.showX = true
      cutter.control.showY = true
      cutter.control.showZ = false
    } )
  }

  createSectionPlane() {
    let cutter = { }

    cutter.id = this.cutters.length
    cutter.visible = false
    cutter.plane = new THREE.Plane( new THREE.Vector3( 0, 0, -1 ), 1 )

    cutter.helper = new THREE.Mesh( new THREE.PlaneGeometry( 1, 1, 1 ), new THREE.MeshBasicMaterial( { color: 0xAFAFAF, transparent: true, opacity: 0.1, side: THREE.DoubleSide } ) )
    cutter.helper.visible = false
    this.viewer.scene.add( cutter.helper )

    cutter.control = new TransformControls( this.viewer.camera, this.viewer.renderer.domElement )
    cutter.control.setSize( 0.5 )
    cutter.control.space = 'local'
    cutter.control.showX = false
    cutter.control.showY = false
    cutter.control.setRotationSnap( THREE.MathUtils.degToRad( 15 ) )

    cutter.control.addEventListener( 'change', () => this.viewer.render )
    cutter.control.addEventListener( 'dragging-changed', ( event ) => {
      if ( !cutter.visible ) return
      this.viewer.controls.enabled = !event.value

      // Reference: https://stackoverflow.com/a/52124409
      let normal = new THREE.Vector3()
      let point = new THREE.Vector3()
      normal.set( 0, 0, -1 ).applyQuaternion( cutter.helper.quaternion )
      point.copy( cutter.helper.position )
      cutter.plane.setFromNormalAndCoplanarPoint( normal, point )
    } )

    cutter.control.attach( cutter.helper )
    cutter.control.visible = false
    this.viewer.scene.add( cutter.control )

    this.cutters.push( cutter )

    // adds local clipping planes to all materials
    let objs = this.viewer.sceneManager.filteredObjects
    objs.forEach( obj => {
      obj.material.clippingPlanes = this.cutters.map( c => c.plane )
    } )
  }

  toggleSectionPlanes() {
    if ( this.visible ) this.hideSectionPlanes()
    else this.showSectionPlanes()

    this.visible = !this.visible
  }

  showSectionPlanes() {
    this._matchSceneSize()

    this.cutters.forEach( cutter => {
      cutter.visible = true
      cutter.helper.visible = true
      cutter.control.visible = true
    } )

    this.viewer.renderer.localClippingEnabled = true
  }

  hideSectionPlanes() {
    this.cutters.forEach( cutter => {
      cutter.visible = false
      cutter.helper.visible = false
      cutter.control.visible = false
    } )
    this.viewer.renderer.localClippingEnabled = false
  }

  _matchSceneSize() {
    // Scales and translate helper to scene bbox center and origin
    const sceneBox = new THREE.Box3().setFromObject( this.viewer.sceneManager.userObjects )
    const sceneSize = new THREE.Vector3()
    sceneBox.getSize( sceneSize )
    const sceneCenter = new THREE.Vector3()
    sceneBox.getCenter( sceneCenter )

    this.cutters.forEach( cutter => {
      cutter.helper.scale.set( sceneSize.x > 0 ? sceneSize.x : 1, sceneSize.y > 0 ? sceneSize.y : 1, sceneSize.z >0 ? sceneSize.z : 1 )
      cutter.helper.position.set( sceneCenter.x, sceneCenter.y, sceneCenter.z )

      let normal = new THREE.Vector3()
      let point = new THREE.Vector3()
      normal.set( 0, 0, -1 ).applyQuaternion( cutter.helper.quaternion )
      point.copy( cutter.helper.position )
      cutter.plane.setFromNormalAndCoplanarPoint( normal, point )
    } )

  }

}
