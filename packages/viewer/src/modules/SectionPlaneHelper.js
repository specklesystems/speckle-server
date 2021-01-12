import * as THREE from 'three'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'

/**
 * WIP: A utility class
 */
export default class SectionPlaneHelper {

  constructor( parent ) {
    this.viewer = parent

    this._createCutter()
  }

  getClippingPlanes() {
    return [ this.xyPlane ]
  }

  toggleControls() {
    if ( this.xyControl.mode === 'rotate' ) return this.xyControl.setMode( 'translate' )
    this.xyControl.setMode( 'rotate' )
  }

  _createCutter() {
    this.xyVisible = false
    this.xyPlane = new THREE.Plane( new THREE.Vector3( 0, 0, -1 ), 1 )
    const geometry = new THREE.PlaneGeometry( 1, 1, 1 )
    this.xyHelper = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0xAFAFAF, transparent: true, opacity: 0.1, side: THREE.DoubleSide } ) )
    this.xyHelper.visible = false
    this.viewer.scene.add( this.xyHelper )

    this.xyControl = new TransformControls( this.viewer.camera, this.viewer.renderer.domElement )
    this.xyControl.setSize( 0.6 )
    this.xyControl.space = 'local'

    this.xyControl.addEventListener( 'change', () => this.viewer.render )
    this.xyControl.addEventListener( 'dragging-changed', ( event ) => {
      if ( !this.xyVisible ) return

      this.viewer.controls.enabled = !event.value

      // Reference: https://stackoverflow.com/a/52124409
      let normal = new THREE.Vector3()
      let point = new THREE.Vector3()
      normal.set( 0, 0, -1 ).applyQuaternion( this.xyHelper.quaternion )
      point.copy( this.xyHelper.position )
      this.xyPlane.setFromNormalAndCoplanarPoint( normal, point )
    } )

    this.xyControl.attach( this.xyHelper )
    this.xyControl.visible = false
    this.viewer.scene.add( this.xyControl )
  }

  toggleCutter() {
    if ( this.xyVisible ) this.hideCutter()
    else this.showCutter()
  }

  showCutter() {
    if ( this.xyVisible ) return
    // Scales and translate helper to scene bbox center and origin
    const sceneBox = new THREE.Box3().setFromObject( this.viewer.sceneManager.userObjects )
    const sceneSize = new THREE.Vector3()
    sceneBox.getSize( sceneSize )
    const sceneCenter = new THREE.Vector3()
    sceneBox.getCenter( sceneCenter )

    this.xyHelper.scale.set( sceneSize.x, sceneSize.y, sceneSize.z )
    this.xyHelper.position.set( sceneCenter.x, sceneCenter.y, sceneCenter.z )

    let normal = new THREE.Vector3()
    let point = new THREE.Vector3()
    normal.set( 0, 0, -1 ).applyQuaternion( this.xyHelper.quaternion )
    point.copy( this.xyHelper.position )
    this.xyPlane.setFromNormalAndCoplanarPoint( normal, point )

    this.xyVisible = true
    this.xyHelper.visible = true
    this.xyControl.visible = true

    this.viewer.renderer.localClippingEnabled = true
  }

  hideCutter() {
    if ( !this.xyVisible ) return
    this.xyVisible = false
    this.xyHelper.visible = false
    this.xyControl.visible = false
    this.viewer.renderer.localClippingEnabled = false
  }

}
