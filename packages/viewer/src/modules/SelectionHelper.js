import * as THREE from 'three'
import debounce from 'lodash.debounce'
import EventEmitter from './EventEmitter'

export default class SelectionHelper extends EventEmitter {

  constructor( parent ) {
    super()
    this.viewer = parent
    this.raycaster = new THREE.Raycaster()

    this.orbiting = false
    this.viewer.controls.addEventListener( 'change', debounce( () => { this.orbiting = false }, 100 ) )
    this.viewer.controls.addEventListener( 'start', debounce( () => { this.orbiting = true }, 200 )  )
    this.viewer.controls.addEventListener( 'end', debounce( () => { this.orbiting = false }, 200 )  )

    // Handle mouseclicks
    this.viewer.renderer.domElement.addEventListener( 'pointerup', ( e ) => {
      if ( this.orbiting ) return

      let selectionObjects = this.getClickedObjects( e )
      this.handleSelection( selectionObjects )
    } )

    this.viewer.renderer.domElement.addEventListener( 'dblclick', ( e ) => {
      if ( this.orbiting ) return

      let selectionObjects = this.getClickedObjects( e )

      this.emit( 'object-doubleclicked', selectionObjects )
      this.handleDoubleClick( selectionObjects )
    } )

    // Handle multiple object selection
    this.multiSelect = false
    document.addEventListener( 'keydown', ( e ) => {
      if ( e.isComposing || e.keyCode === 229 ) return
      if ( e.key === 'Shift' ) this.multiSelect = true
    } )
    document.addEventListener( 'keyup', ( e ) => {
      if ( e.isComposing || e.keyCode === 229 ) return
      if ( e.key === 'Shift' ) this.multiSelect = false
    } )

    this.selectionMaterial = new THREE.MeshLambertMaterial( { color: 0x0B55D2, emissive: 0x0B55D2, side: THREE.DoubleSide } )
    this.selectedObjects = new THREE.Group()
    this.selectedObjects.renderOrder = 1000
    this.viewer.scene.add( this.selectedObjects )

    this.originalSelectionObjects = []
  }

  handleSelection( objects ) {
    this.select( objects[0] )
  }

  handleDoubleClick( objects ) {
    if ( !objects || objects.length === 0 ) this.viewer.sceneManager.zoomExtents()
    else this.viewer.sceneManager.zoomToObject( objects[0].object )
  }

  select( obj ) {
    if ( !this.multiSelect ) this.unselect()
    if ( !obj ) {
      this.emit( 'object-clicked', this.originalSelectionObjects )
      return
    }

    let mesh = new THREE.Mesh( obj.object.geometry, this.selectionMaterial )
    this.selectedObjects.add( mesh )
    this.originalSelectionObjects.push( obj )
    this.emit( 'object-clicked', this.originalSelectionObjects )
  }

  unselect() {
    this.selectedObjects.clear()
    this.originalSelectionObjects = []
  }

  getClickedObjects( e ) {
    const normalizedPosition = this._getNormalisedClickPosition( e )
    this.raycaster.setFromCamera( normalizedPosition, this.viewer.camera )
    const intersectedObjects = this.raycaster.intersectObjects( this.viewer.sceneManager.userObjects.children )
    return intersectedObjects
  }

  _getNormalisedClickPosition( e ) {
    // Reference: https://threejsfundamentals.org/threejs/lessons/threejs-picking.html
    const canvas = this.viewer.renderer.domElement
    const rect = this.viewer.renderer.domElement.getBoundingClientRect()

    const pos = {
      x: ( e.clientX - rect.left ) * canvas.width / rect.width,
      y: ( e.clientY - rect.top ) * canvas.height / rect.height
    }
    return {
      x: ( pos.x / canvas.width ) *  2 - 1,
      y: ( pos.y / canvas.height ) * -2 + 1
    }
  }

  dispose() {
    this.viewer.scene.remove( this.selectedObjects )
    this.unselect()
    this.originalSelectionObjects = null
    this.selectionMaterial = null
    this.selectedObjects = null
  }

}
