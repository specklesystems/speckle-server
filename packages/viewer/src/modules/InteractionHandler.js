import * as THREE from 'three'
import SectionBox from './SectionBox'
import SelectionHelper from './SelectionHelper'

export default class InteractionHandler {

  constructor( viewer ) {
    this.viewer = viewer

    this.sectionBox = new SectionBox( this.viewer )
    this.sectionBox.toggle() // switch off

    this.preventSelection = false

    this.selectionHelper = new SelectionHelper( this.viewer, { subset: this.viewer.sceneManager.userObjects, sectionBox: this.sectionBox } )
    this.selectionMaterial = new THREE.MeshLambertMaterial( { color: 0x0B55D2, emissive: 0x0B55D2, side: THREE.DoubleSide } )
    this.selectionMaterial.clippingPlanes = this.sectionBox.planes
    this.selectionEdgesMaterial = new THREE.LineBasicMaterial( { color: 0x23F3BD } )
    this.selectionEdgesMaterial.clippingPlanes = this.sectionBox.planes

    this.selectedObjects = new THREE.Group()
    this.viewer.scene.add( this.selectedObjects )
    this.selectedObjects.renderOrder = 1000

    this.selectionHelper.on( 'object-doubleclicked', this._handleDoubleClick.bind( this ) )
    this.selectionHelper.on( 'object-clicked', this._handleSelect.bind( this ) )

    this.viewer.sceneManager.materials.forEach( mat => mat.clippingPlanes = this.sectionBox.planes )
  }

  _handleDoubleClick( objs ) {
    if ( !objs || objs.length === 0 ) this.zoomExtents()
    else this.zoomToObject( objs[0].object )
    this.viewer.needsRender = true
  }

  _handleSelect( objs ) {
    if ( this.preventSelection ) return

    if ( objs.length === 0 ) {
      this.deselectObjects()
      return
    }

    if ( !this.selectionHelper.multiSelect ) this.deselectObjects()

    let mesh = new THREE.Mesh( objs[0].object.geometry, this.selectionMaterial )
    let box = new THREE.BoxHelper( mesh, 0x23F3BD )
    box.material = this.selectionEdgesMaterial
    this.selectedObjects.add( mesh )
    this.selectedObjects.add( box )
    this.viewer.needsRender = true
  }

  deselectObjects() {
    this.selectedObjects.clear()
    this.viewer.needsRender = true
  }

  toggleSectionBox() {
    this.sectionBox.toggle()
    if ( this.sectionBox.display.visible ) {
      if ( this.selectedObjects.children.length === 0 ) {
        this.sectionBox.setBox( this.viewer.sceneManager.getSceneBoundingBox() )
        this.zoomExtents()
      }
      else {
        let box = new THREE.Box3().setFromObject( this.selectedObjects )
        this.sectionBox.setBox( box )
        this.zoomToBox( box )
      }
    } else {
      this.preventSelection = false
    }
    this.viewer.needsRender = true
  }

  hideSectionBox() {
    if ( !this.sectionBox.display.visible ) return
    this.toggleSectionBox( )
  }

  showSectionBox() {
    if ( this.sectionBox.display.visible ) return
    this.toggleSectionBox( )
  }

  zoomToObject( target ) {
    const box = new THREE.Box3().setFromObject( target )
    this.zoomToBox( box )
  }

  zoomExtents() {
    if ( this.sectionBox.display.visible ) {
      this.zoomToObject( this.sectionBox.boxMesh )
      return
    }
    if ( this.viewer.sceneManager.objects.length === 0 )  {
      let box = new THREE.Box3( new THREE.Vector3( -1,-1,-1 ), new THREE.Vector3( 1,1,1 ) )
      this.zoomToBox( box )
      this.viewer.controls.setBoundary( box )
      return
    }

    let box = new THREE.Box3().setFromObject( this.viewer.sceneManager.userObjects )
    this.zoomToBox( box )
    this.viewer.controls.setBoundary( box )
  }

  zoomToBox( box ) {
    const fitOffset = 1.2

    const size = box.getSize( new THREE.Vector3() )
    let target = new THREE.Sphere()
    box.getBoundingSphere( target )
    target.radius = target.radius * fitOffset

    this.viewer.controls.fitToSphere( target, true )

    const maxSize = Math.max( size.x, size.y, size.z )
    const fitHeightDistance = maxSize / ( 2 * Math.atan( Math.PI * this.viewer.camera.fov / 360 ) )
    const fitWidthDistance = fitHeightDistance / this.viewer.camera.aspect
    const distance = fitOffset * Math.max( fitHeightDistance, fitWidthDistance )

    this.viewer.controls.minDistance = distance / 100
    this.viewer.controls.maxDistance = distance * 100
    this.viewer.camera.near = distance / 100
    this.viewer.camera.far = distance * 100
    this.viewer.camera.updateProjectionMatrix()
  }
}
