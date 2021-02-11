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
 * 
 * optional param to configure SelectionHelper
 * _options = {
 *             subset: THREE.Group
 *             hover:  boolean
 *            }
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
    // this.subset = typeof _options !== 'undefined' && typeof _options.subset !== 'undefined'  ? _options.subset : null;
    this.subset = typeof _options !== 'undefined' && typeof _options.subset !== 'undefined'  ? _options.subset : null;
    
    this.pointerDown = false;
    // this.hoverObj = null
    
    // optional param allows for hover
    if(typeof _options !== 'undefined' && _options.hover) {
      // doesn't feel good when debounced, might be necessary tho
      this.viewer.renderer.domElement.addEventListener( 'pointermove', debounce((e) => {
        let hovered = this.getClickedObjects(e)
        
        // dragging event, this shouldn't be under the "hover option"
        if(this.pointerDown) {
          this.emit('object-drag', hovered, this._getNormalisedClickPosition(e))
          return
        }
        
        this.emit('hovered', hovered, e)
      },0))
    }

    // dragging event, this shouldn't be under the "hover option"
    if(typeof _options !== 'undefined' && _options.hover) {
      this.viewer.renderer.domElement.addEventListener( 'pointerdown', debounce(( e ) => {
        this.pointerDown = true

        if ( this.orbiting ) return
          
        this.emit( 'mouse-down', this.getClickedObjects(e))
      },100))
    }

    // Handle mouseclicks
    this.viewer.renderer.domElement.addEventListener( 'pointerup', ( e ) => {
      this.pointerDown = false

      if ( this.orbiting ) return

      let selectionObjects = this.getClickedObjects( e )
      
      this.emit('object-clicked', selectionObjects)
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

    this.originalSelectionObjects = []
  }

  unselect() {
    this.originalSelectionObjects = []
  }

  getClickedObjects( e ) {
    const normalizedPosition = this._getNormalisedClickPosition( e )
    this.raycaster.setFromCamera( normalizedPosition, this.viewer.camera )

    let intersectedObjects = this.raycaster.intersectObjects( this.subset ? this._getGroupChildren(this.subset) : this.viewer.sceneManager.objects )
    intersectedObjects = intersectedObjects.filter( obj => this.viewer.sectionPlaneHelper.activePlanes.every( pl => pl.distanceToPoint( obj.point ) > 0 ) )

    return intersectedObjects
  }

  // get all children of a subset passed as a THREE.Group
  _getGroupChildren(group){
    let children = []
    if(group.children.length === 0) return [group]
    group.children.forEach((c,i,a) => children = [...children, ...this._getGroupChildren(c)])
    return children
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
    this.unselect()
    this.originalSelectionObjects = null
  }
}
