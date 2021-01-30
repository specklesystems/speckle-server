import * as THREE from 'three'
import debounce from 'lodash.debounce'
import EventEmitter from './EventEmitter'

/**
 * Selects and deselects user added objects in the scene. Emits the array of all intersected objects on click.
 * Behaviours:
 * - Clicking on one object will select it.
 * - Double clicking on one object will focus on it.
 * - Double clicking anywhere else will focus the scene.
 * - Pressing escape will clear any selection present.
 * TODOs:
 * - Ensure clipped geometry is not selected.
 * - When objects are disposed, ensure selection is reset.
 */

 /*
  * NS Notes:
  * -make more configurable with options param
  * _options = {
  *             subset: [list of objects]
  *             hover:  boolean
  *            }
  * Proposal to make this more general by putting client specific event handling logic in client
  * i.e. Viewer implements handleClick and this just emits the event
  * use cases: selecting section box face, text, tags, dims vs geometry
  *
  */

export default class SelectionHelper extends EventEmitter {

  constructor( parent, _options ) {
    super()
    this.viewer = parent
    this.raycaster = new THREE.Raycaster()

    // Handle clicks during camera moves
    this.orbiting = false
    this.viewer.controls.addEventListener( 'change', debounce( () => { this.orbiting = false }, 100 ) )
    this.viewer.controls.addEventListener( 'start', debounce( () => { this.orbiting = true }, 200 )  )
    this.viewer.controls.addEventListener( 'end', debounce( () => { this.orbiting = false }, 200 )  )

    // optional param allows for raycasting against a subset of objects
    this.subset = typeof _options !== 'undefined' && typeof _options.subset !== 'undefined'  ? _options.subset : null;

    // optional param allows for hover
    // these events inside of events are weird if you think about them too much
    if(typeof _options !== 'undefined' && _options.hover) {
      // doesn't feel good when debounced, might be necessary tho
      this.viewer.renderer.domElement.addEventListener( 'pointermove', (e) => {
        let hovered = this.getClickedObjects(e);
        if(hovered.length > 0) this.emit('hovered', hovered);
      })
    }

    // Handle mouseclicks
    this.viewer.renderer.domElement.addEventListener( 'pointerup', ( e ) => {
      if ( this.orbiting ) return

      let selectionObjects = this.getClickedObjects( e )
      this.handleSelection( selectionObjects )
    } )

    // Doubleclicks on touch devices
    // http://jsfiddle.net/brettwp/J4djY/
    this.tapTimeout
    this.lastTap = 0
    this.touchLocation
    this.viewer.renderer.domElement.addEventListener( 'touchstart', ( e ) => { this.touchLocation = e.targetTouches[0] } )
    this.viewer.renderer.domElement.addEventListener( 'touchend', ( event ) => {
      var currentTime = new Date().getTime()
      var tapLength = currentTime - this.lastTap
      clearTimeout( this.tapTimeout )
      if ( tapLength < 500 && tapLength > 0 ) {
        let selectionObjects = this.getClickedObjects( this.touchLocation )
        this.emit( 'object-doubleclicked', selectionObjects )
        // NS: will need to reimplement this in Viewer
        // if ( !this.orbiting )
        //   this.handleDoubleClick( selectionObjects )
        // event.preventDefault()
      } else {
        this.tapTimeout = setTimeout( function() {
          clearTimeout( this.tapTimeout )
        }, 500 )
      }
      this.lastTap = currentTime
    } )

    this.viewer.renderer.domElement.addEventListener( 'dblclick', ( e ) => {
      // if ( this.orbiting ) return // not needed for zoom to thing?

      let selectionObjects = this.getClickedObjects( e )

      this.emit( 'object-doubleclicked', selectionObjects )
      // this.handleDoubleClick( selectionObjects )
    } )

    // Handle multiple object selection
    this.multiSelect = false
    document.addEventListener( 'keydown', ( e ) => {
      if ( e.isComposing || e.keyCode === 229 ) return
      if ( e.key === 'Shift' ) this.multiSelect = true
      if ( e.key === 'Escape' ) this.unselect( )
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

  // NS: this should be handled in viewer
  // handleDoubleClick( objects ) {
  //   if ( !objects || objects.length === 0 ) this.viewer.sceneManager.zoomExtents()
  //   else this.viewer.sceneManager.zoomToObject( objects[0].object )
  // }

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

    let intersectedObjects = this.raycaster.intersectObjects( this.subset ? this.subset : this.viewer.sceneManager.objects )
    intersectedObjects = intersectedObjects.filter( obj => this.viewer.sectionPlaneHelper.activePlanes.every( pl => pl.distanceToPoint( obj.point ) > 0 ) )

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
