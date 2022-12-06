import * as THREE from 'three'
import EventEmitter from '../EventEmitter'
import { ObjectLayers } from '../SpeckleRenderer'

/**
 * Selects and deselects user added objects in the scene. Emits the array of all intersected objects on click.
 * optional param to configure SelectionHelper
 * _options = {
 *             subset: THREE.Group
 *             hover:  boolean.
 *             sectionBox: if present, will test for inclusion
 *            }
 */

export default class _SelectionHelper extends EventEmitter {
  constructor(parent, _options) {
    super()
    this.viewer = parent
    this.raycaster = new THREE.Raycaster()
    this.raycaster.params.Line.threshold = 0.1
    this.raycaster.params.Line2 = {}
    this.raycaster.params.Line2.threshold = 1
    this.raycaster.layers.set(ObjectLayers.PROPS)

    // optional param allows for raycasting against a subset of objects
    // this.subset = typeof _options !== 'undefined' && typeof _options.subset !== 'undefined'  ? _options.subset : null;
    this.subset =
      typeof _options !== 'undefined' && typeof _options.subset !== 'undefined'
        ? _options.subset
        : null

    this.pointerDown = false

    this.checkForSectionBoxInclusion = true
    if (typeof _options !== 'undefined' && _options.checkForSectionBoxInclusion) {
      this.sectionBox = _options.checkForSectionBoxInclusion
    }

    // Handle mouseclicks
    let mdTime
    this.viewer.speckleRenderer.renderer.domElement.addEventListener(
      'pointerdown',
      (e) => {
        e.preventDefault()
        mdTime = new Date().getTime()
      }
    )

    this.viewer.speckleRenderer.renderer.domElement.addEventListener(
      'pointerup',
      (e) => {
        e.preventDefault()
        if (this.viewer.cameraHandler.orbiting) return

        const delta = new Date().getTime() - mdTime
        this.pointerDown = false

        if (delta > 250) return

        const selectionObjects = this.getClickedObjects(e)
        this.emit('object-clicked', selectionObjects)
      }
    )

    // Doubleclicks on touch devices
    // http://jsfiddle.net/brettwp/J4djY/
    this.tapTimeout
    this.lastTap = 0
    this.touchLocation

    this.viewer.speckleRenderer.renderer.domElement.addEventListener(
      'touchstart',
      (e) => {
        this.touchLocation = e.targetTouches[0]
      }
    )
    this.viewer.speckleRenderer.renderer.domElement.addEventListener(
      'touchend',
      (e) => {
        // Ignore the first `touchend` when pinch-zooming (so we don't consider double-tap)
        if (e.targetTouches.length > 0) {
          return
        }
        const currentTime = new Date().getTime()
        const tapLength = currentTime - this.lastTap
        clearTimeout(this.tapTimeout)
        if (tapLength < 500 && tapLength > 0) {
          const selectionObjects = this.getClickedObjects(this.touchLocation)
          this.emit('object-doubleclicked', selectionObjects)
        } else {
          this.tapTimeout = setTimeout(function () {
            clearTimeout(this.tapTimeout)
          }, 500)
        }
        this.lastTap = currentTime
      }
    )

    this.viewer.speckleRenderer.renderer.domElement.addEventListener(
      'dblclick',
      (e) => {
        const selectionObjects = this.getClickedObjects(e)
        this.emit('object-doubleclicked', selectionObjects)
      }
    )

    // Handle multiple object selection
    this.multiSelect = false

    document.addEventListener('keydown', (e) => {
      if (e.isComposing || e.keyCode === 229) return
      if (e.key === 'Shift') this.multiSelect = true
      if (e.key === 'Escape') this.unselect()
    })

    document.addEventListener('keyup', (e) => {
      if (e.isComposing || e.keyCode === 229) return
      if (e.key === 'Shift') this.multiSelect = false
    })

    this.originalSelectionObjects = []
  }

  unselect() {
    this.originalSelectionObjects = []
  }

  getClickedObjects(e) {
    const normalizedPosition = this._getNormalisedClickPosition(e)
    this.raycaster.setFromCamera(
      normalizedPosition,
      this.viewer.cameraHandler.activeCam.camera
    )
    // this.viewer.intersections.intersectScene(this.raycaster)
    /**
     * This 'subset' thing is really weird and it's breaking picking. I would gladly
     * do something about it, however I'm afraid that it will open up a can of worms,
     * which are out-of-scope for now 26.05.2022
     */
    // const targetObjects = this.subset
    //   ? this.subset
    //   : this.viewer.sceneManager.filteredObjects
    let intersectedObjects = [] // = this.raycaster.intersectObjects(targetObjects)
    // // filters objects in section box mode
    if (this.viewer.sectionBox.display.visible && this.checkForSectionBoxInclusion) {
      // const box = new THREE.Box3().setFromObject(this.viewer.sectionBox.cube)
      intersectedObjects = this.raycaster.intersectObject(this.viewer.sectionBox.cube)
      // console.log(ret)
      // intersectedObjects = intersectedObjects.filter((obj) => {
      //   return box.containsPoint(obj.point)
      // })
    }
    return intersectedObjects
  }

  _getNormalisedClickPosition(e) {
    // Reference: https://threejsfundamentals.org/threejs/lessons/threejs-picking.html
    const canvas = this.viewer.speckleRenderer.renderer.domElement
    const rect = this.viewer.speckleRenderer.renderer.domElement.getBoundingClientRect()

    const pos = {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height
    }
    return {
      x: (pos.x / canvas.width) * 2 - 1,
      y: (pos.y / canvas.height) * -2 + 1
    }
  }

  dispose() {
    super.dispose()
    this.unselect()
    this.originalSelectionObjects = null
  }
}
