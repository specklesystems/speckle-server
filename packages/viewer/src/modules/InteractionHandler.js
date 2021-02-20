import * as THREE from 'three'

import SectionBox from './SectionBox'
import SectionBox2 from './SectionBox2'
import SelectionHelper from './SelectionHelper'

export default class InteractionHandler {

  constructor( viewer ) {
    this.viewer = viewer

    // this.sectionBox = new SectionBox( this.viewer )
    this.sectionBoxEnabled = false

    this.selectionHelper = new SelectionHelper( this.viewer, this.viewer.sceneManager.userObjects )
    this.selectionMaterial = new THREE.MeshLambertMaterial( { color: 0x0B55D2, emissive: 0x0B55D2, side: THREE.DoubleSide } )
    // this.selectionMaterial.clippingPlanes = this.sectionBox.planes.map( c => c.plane )
    this.selectionEdgesMaterial = new THREE.LineBasicMaterial( { color: 0x23F3BD } )
    // this.selectionEdgesMaterial.clippingPlanes = this.sectionBox.planes.map( c => c.plane )

    this.selectedObjects = new THREE.Group()
    this.viewer.scene.add( this.selectedObjects )
    this.selectedObjects.renderOrder = 1000

    this.selectionHelper.on( 'object-doubleclicked', this._handleDoubleClick.bind( this ) )
    this.selectionHelper.on( 'object-clicked', this._handleSelect.bind( this ) )

  }

  _handleDoubleClick( objs ) {
    if ( !objs || objs.length === 0 ) this.viewer.sceneManager.zoomExtents()
    else this.viewer.sceneManager.zoomToObject( objs[0].object )
    this.viewer.needsRender = true
  }

  _handleSelect( obj ) {
    if ( obj.length === 0 ) {
      this.deselectObjects()
      return
    }

    if ( !this.selectionHelper.multiSelect ) this.deselectObjects()

    let mesh = new THREE.Mesh( obj[0].object.geometry, this.selectionMaterial )
    this.selectedObjects.add( mesh )

    const bbox = new THREE.Box3().setFromObject( mesh )
    const size = bbox.getSize( new THREE.Vector3() )
    bbox.expandByVector( size.multiplyScalar( 0.1 ) )
    const helper = new THREE.Box3Helper( bbox, 0x29308C )
    helper.material = this.selectionEdgesMaterial
    // TODO: if selection box is active, add planes to helper material clipping
    this.selectedObjects.add( helper )

    this.viewer.needsRender = true
  }

  deselectObjects() {
    this.selectedObjects.clear()
    this.viewer.needsRender = true
  }

  toggleSectionBox() {
    this.sectionBoxEnabled = !this.sectionBoxEnabled
    if ( this.sectionBoxEnabled ) {
      this.showSelectionBox()
    } else {
      this.hideSelectionBox()
    }
  }

  showSelectionBox() {
    this.viewer.renderer.localClippingEnabled = true

    let bbox = null
    let setFromSelection = false
    if ( this.selectedObjects.children.length > 0 ) {
      bbox = new THREE.Box3().setFromObject( this.selectedObjects.children[0] )
      setFromSelection = true
    } else {
      bbox = this.viewer.sceneManager.getSceneBoundingBox()
    }
    this.viewer.sceneManager.zoomToBox( bbox )
    this.sectionBox.setFromBbox( bbox, setFromSelection ? 0.3 : 0.1 )
    this.sectionBox.display.visible = true
    this.viewer.needsRender = true
    this.sectionBoxEnabled = true
  }

  hideSelectionBox() {
    this.viewer.renderer.localClippingEnabled = false
    this.sectionBox.display.visible = false
    this.viewer.needsRender = true
    this.sectionBoxEnabled = false
  }

  test() {
    let tt = new SectionBox2( this.viewer )
  }
}
