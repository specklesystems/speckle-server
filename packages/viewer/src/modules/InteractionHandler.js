import * as THREE from 'three'
import SectionBox from './SectionBox'
import SelectionHelper from './SelectionHelper'

export default class InteractionHandler {

  constructor( viewer ) {
    this.viewer = viewer
    this.preventSelection = false
    this.selectionHelper = new SelectionHelper( this.viewer, { subset: this.viewer.sceneManager.userObjects, sectionBox: this.sectionBox } )
    this.selectionMeshMaterial = new THREE.MeshLambertMaterial( { color: 0x0B55D2, emissive: 0x0B55D2, side: THREE.DoubleSide } )
    this.selectionMeshMaterial.clippingPlanes = this.viewer.sectionBox.planes

    this.selectionLineMaterial = new THREE.LineBasicMaterial( { color: 0x0B55D2 } )
    this.selectionLineMaterial.clippingPlanes = this.viewer.sectionBox.planes

    this.selectionEdgesMaterial = new THREE.LineBasicMaterial( { color: 0x23F3BD } )
    this.selectionEdgesMaterial.clippingPlanes = this.viewer.sectionBox.planes

    this.selectedObjects = new THREE.Group()
    this.viewer.scene.add( this.selectedObjects )
    this.selectedObjects.renderOrder = 1000

    this.selectedObjectsUserData = []

    this.selectionHelper.on( 'object-doubleclicked', this._handleDoubleClick.bind( this ) )
    this.selectionHelper.on( 'object-clicked', this._handleSelect.bind( this ) )

    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape' && this.viewer.mouseOverRenderer){
        this.deselectObjects()
      }
    })
  }

  _handleDoubleClick( objs ) {
    if ( !objs || objs.length === 0 ) { 
      if( this.viewer.sectionBox.display.visible ) {
        this.zoomToObject( this.viewer.sectionBox.cube )
      } else {
        this.zoomExtents() 
      }
    }
    else this.zoomToObject( objs[0].object )
    this.viewer.needsRender = true
    this.viewer.emit( 'object-doubleclicked', objs && objs.length !== 0 ? objs[0].object : null )
  }

  _handleSelect( objs ) {
    console.log(this.viewer.cameraHandler.orbiting )
    if(this.viewer.cameraHandler.orbiting ) return
    if ( this.preventSelection ) return

    if ( objs.length === 0 ) {
      this.deselectObjects()
      return
    }

    if ( !this.selectionHelper.multiSelect ) this.deselectObjects()
    
    let selType = objs[0].object.type
    
    if ( objs[0].object.parent?.userData?.speckle_type?.toLowerCase().includes( 'blockinstance' ) ) {
      selType = 'Block'
    }

    switch ( selType ) {
    case 'Block': 
      // TODO: maybe just leave the bounding box for now
      break
    case 'Mesh':
      this.selectedObjects.add( new THREE.Mesh( objs[0].object.geometry, this.selectionMeshMaterial ) )
      break
    case 'Line':
      this.selectedObjects.add( new THREE.Line( objs[0].object.geometry, this.selectionMeshMaterial ) )
      break
    case 'Point':
      console.warn( 'Point selection not implemented.' )
      return // exit the whole func here, points cause all sorts of trouble when being selected (ie, bbox stuff)
    }

    this.selectedObjectsUserData.push( objs[0].object.userData )

    let box 
    if ( selType === 'Block' ) {
      box = new THREE.BoxHelper( objs[0].object.parent, 0x23F3BD )
    } else {
      box = new THREE.BoxHelper( objs[0].object, 0x23F3BD )
    }
    box.material = this.selectionEdgesMaterial
    this.selectedObjects.add( box )
    this.viewer.needsRender = true
    this.viewer.emit( 'select', this.selectedObjectsUserData )
  }

  deselectObjects() {
    this.selectedObjects.clear()
    this.selectedObjectsUserData = []
    this.viewer.needsRender = true
    this.viewer.emit( 'select', this.selectedObjectsUserData )
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

  zoomToObject( target, fit = 1.2, transition = true ) {
    const box = new THREE.Box3().setFromObject( target )
    this.zoomToBox( box, fit, transition )
  }

  zoomExtents( fit = 1.2, transition = true ) {
    // if ( this.sectionBox.display.visible ) {
    //   this.zoomToObject( this.sectionBox.boxMesh )
    //   return
    // }
    if ( this.viewer.sceneManager.sceneObjects.allObjects.length === 0 )  {
      let box = new THREE.Box3( new THREE.Vector3( -1,-1,-1 ), new THREE.Vector3( 1,1,1 ) )
      this.zoomToBox( box, fit, transition )
      return
    }

    let box = new THREE.Box3().setFromObject( this.viewer.sceneManager.sceneObjects.allObjects )
    this.zoomToBox( box, fit, transition )
    // this.viewer.controls.setBoundary( box )
  }

  zoomToBox( box, fit = 1.2, transition = true ) {
    if(box.max.x === Infinity || box.max.x === -Infinity) {
      box = new THREE.Box3( new THREE.Vector3( -10,-10,-10 ), new THREE.Vector3( 10,10,10 ) )
    }
    const fitOffset = fit

    const size = box.getSize( new THREE.Vector3() )
    let target = new THREE.Sphere()
    box.getBoundingSphere( target )
    target.radius = target.radius * fitOffset

    this.viewer.cameraHandler.activeCam.controls.fitToSphere( target, transition )

    const maxSize = Math.max( size.x, size.y, size.z )
    const fitHeightDistance = maxSize / ( 2 * Math.atan( Math.PI * this.viewer.cameraHandler.camera.fov / 360 ) )
    const fitWidthDistance = fitHeightDistance / this.viewer.cameraHandler.camera.aspect
    const distance = fitOffset * Math.max( fitHeightDistance, fitWidthDistance )

    this.viewer.cameraHandler.controls.minDistance = distance / 100
    this.viewer.cameraHandler.controls.maxDistance = distance * 100
    this.viewer.cameraHandler.camera.near = distance / 100
    this.viewer.cameraHandler.camera.far = distance * 100
    this.viewer.cameraHandler.camera.updateProjectionMatrix()
    this.viewer.cameraHandler.orthoCamera.near = distance / 100
    this.viewer.cameraHandler.orthoCamera.far = distance * 100
    this.viewer.cameraHandler.orthoCamera.updateProjectionMatrix()
  }

  /**
   * Allows camera to go "underneath" or not. By default, this function will set
   * the max polar angle to Pi, allowing the camera to look from down upwards.
   * @param {[type]} angle [description]
   */
  setMaxPolarAngle( angle = Math.PI ) {
    this.viewer.controls.maxPolarAngle = angle
  }

  rotateCamera( azimuthAngle = 0.261799, polarAngle = 0, transition = true ) {
    this.viewer.controls.rotate( azimuthAngle, polarAngle, transition )
  }

  screenshot() {
    return this.viewer.renderer.domElement.toDataURL( 'image/png' )
  }

  /**
   * Rotates camera to some canonical views
   * @param  {string}  side       Can be any of front, back, up (top), down (bottom), right, left.
   * @param  {Number}  fit        [description]
   * @param  {Boolean} transition [description]
   * @return {[type]}             [description]
   */
  rotateTo( side, transition = true ) {
    const DEG90 = Math.PI * 0.5
    const DEG180 = Math.PI

    switch ( side ) {
    case 'front':
      this.viewer.cameraHandler.activeCam.controls.rotateTo( 0, DEG90, transition )
      break

    case 'back':
      this.viewer.cameraHandler.activeCam.controls.rotateTo( DEG180, DEG90, transition )
      break

    case 'up':
    case 'top':
      this.viewer.cameraHandler.activeCam.controls.rotateTo( 0, 0, transition )
      break

    case 'down':
    case 'bottom':
      this.viewer.cameraHandler.activeCam.controls.rotateTo( 0, DEG180, transition )
      break

    case 'right':
      this.viewer.cameraHandler.activeCam.controls.rotateTo( DEG90, DEG90, transition )
      break

    case 'left':
      this.viewer.cameraHandler.activeCam.controls.rotateTo( -DEG90, DEG90, transition )
      break
    }
  }

  getViews() {
    return this.viewer.sceneManager.views.map( v => { return { name: v.applicationId, id: v.id } } )
  }

  setView( id, transition = true  ) {
    if ( !id ) return
    let view = this.viewer.sceneManager.views.find( v => v.id === id )
    if ( !view ) {
      console.warn( `View id ${id} not found.` )
      return
    }

    let target = view.target
    let position = view.origin

    this.viewer.cameraHandler.activeCam.controls.setLookAt( position.x, position.y, position.z, target.x, target.y, target.z, transition )
  }

  setLookAt( position, target, transition = true ) {
    if ( !position || !target ) return
    this.viewer.cameraHandler.activeCam.controls.setLookAt( position.x, position.y, position.z, target.x, target.y, target.z, transition )
  }
}
