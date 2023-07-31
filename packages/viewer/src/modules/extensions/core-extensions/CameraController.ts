import * as THREE from 'three'
import CameraControls from 'camera-controls'
import { Extension } from './Extension'
import { SpeckleCameraControls } from '../../objects/SpeckleCameraControls'
import { OrthographicCamera, PerspectiveCamera, Vector3 } from 'three'
import { KeyboardKeyHold, HOLD_EVENT_TYPE } from 'hold-event'
import { CanonicalView, SpeckleView, InlineView, IViewer } from '../../..'
import {
  CameraControllerEvent,
  CameraProjection,
  ICameraProvider,
  PolarView
} from './Providers'

export class CameraController extends Extension implements ICameraProvider {
  get provide() {
    return ICameraProvider.Symbol
  }

  protected _renderingCamera: PerspectiveCamera | OrthographicCamera = null
  protected perspectiveCamera: PerspectiveCamera = null
  protected orthographicCamera: OrthographicCamera = null
  protected controls: SpeckleCameraControls = null

  get renderingCamera(): PerspectiveCamera | OrthographicCamera {
    return this._renderingCamera
  }

  set renderingCamera(value: PerspectiveCamera | OrthographicCamera) {
    this._renderingCamera = value
  }

  public set enabled(val) {
    this.controls.enabled = val
  }

  public get fieldOfView() {
    return this.perspectiveCamera.fov
  }

  public set fieldOfView(value: number) {
    this.perspectiveCamera.fov = value
    this.perspectiveCamera.updateProjectionMatrix()
  }

  public get aspect() {
    return this.perspectiveCamera.aspect
  }

  public constructor(viewer: IViewer) {
    super(viewer)
    /** Create the default perspective camera */
    this.perspectiveCamera = new PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight
    )
    this.perspectiveCamera.up.set(0, 0, 1)
    this.perspectiveCamera.position.set(1, 1, 1)
    this.perspectiveCamera.updateProjectionMatrix()

    const aspect =
      this.viewer.getContainer().offsetWidth / this.viewer.getContainer().offsetHeight

    /** Create the defaultorthographic camera */
    const fustrumSize = 50
    this.orthographicCamera = new OrthographicCamera(
      (-fustrumSize * aspect) / 2,
      (fustrumSize * aspect) / 2,
      fustrumSize / 2,
      -fustrumSize / 2,
      0.001,
      10000
    )
    this.orthographicCamera.up.set(0, 0, 1)
    this.orthographicCamera.position.set(100, 100, 100)
    this.orthographicCamera.updateProjectionMatrix()

    /** Perspective camera as default on startup */
    this.renderingCamera = this.perspectiveCamera

    /** Setup the controls library (urgh...) */
    CameraControls.install({ THREE })
    SpeckleCameraControls.install()
    this.controls = new SpeckleCameraControls(
      this.perspectiveCamera,
      this.viewer.getContainer()
    )
    this.controls.maxPolarAngle = Math.PI / 2
    this.controls.restThreshold = 0.001
    this.setupWASDControls()

    this.controls.addEventListener('rest', () => {
      this.emit(CameraControllerEvent.Stationary)
    })
    this.controls.addEventListener('controlstart', () => {
      this.emit(CameraControllerEvent.Dynamic)
    })

    this.controls.addEventListener('controlend', () => {
      if (this.controls.hasRested) this.emit(CameraControllerEvent.Stationary)
    })

    this.controls.addEventListener('control', () => {
      this.emit(CameraControllerEvent.Dynamic)
    })
  }

  setCameraView(objectIds: string[], transition: boolean, fit?: number): void
  setCameraView(
    view: CanonicalView | SpeckleView | InlineView | PolarView,
    transition: boolean
  ): void
  setCameraView(
    arg0: string[] | CanonicalView | SpeckleView | InlineView | PolarView,
    arg1 = true,
    arg2 = 1.2
  ): void {
    if (Array.isArray(arg0)) {
      this.zoom(arg0, arg2, arg1)
    } else {
      this.setView(arg0, arg1)
    }
  }

  public onUpdate(deltaTime: number) {
    const changed = this.controls.update(deltaTime)
    this.emit(CameraControllerEvent.FrameUpdate, changed)
  }

  public onRender() {
    // NOT IMPLEMENTED
  }

  public onResize() {
    this.perspectiveCamera.aspect =
      this.viewer.getContainer().offsetWidth / this.viewer.getContainer().offsetHeight
    this.perspectiveCamera.updateProjectionMatrix()

    const lineOfSight = new THREE.Vector3()
    this.perspectiveCamera.getWorldDirection(lineOfSight)
    const target = new THREE.Vector3()
    this.controls.getTarget(target)
    const distance = target.clone().sub(this.perspectiveCamera.position)
    const depth = distance.dot(lineOfSight)
    const dims = {
      x: this.viewer.getContainer().offsetWidth,
      y: this.viewer.getContainer().offsetHeight
    }
    const aspect = dims.x / dims.y
    const fov = this.perspectiveCamera.fov
    const height = depth * 2 * Math.atan((fov * (Math.PI / 180)) / 2)
    const width = height * aspect

    this.orthographicCamera.zoom = 1
    this.orthographicCamera.left = width / -2
    this.orthographicCamera.right = width / 2
    this.orthographicCamera.top = height / 2
    this.orthographicCamera.bottom = height / -2
    this.orthographicCamera.updateProjectionMatrix()
  }

  public setPerspectiveCameraOn() {
    if (this._renderingCamera === this.perspectiveCamera) return
    this.renderingCamera = this.perspectiveCamera
    this.setupPerspectiveCamera()
    this.viewer.requestRender()
  }

  public setOrthoCameraOn() {
    if (this._renderingCamera === this.orthographicCamera) return
    this.renderingCamera = this.orthographicCamera
    this.setupOrthoCamera()
    this.viewer.requestRender()
  }

  public toggleCameras() {
    if (this._renderingCamera === this.perspectiveCamera) this.setOrthoCameraOn()
    else this.setPerspectiveCameraOn()
  }

  protected setupOrthoCamera() {
    this.controls.mouseButtons.wheel = CameraControls.ACTION.ZOOM

    const lineOfSight = new THREE.Vector3()
    this.perspectiveCamera.getWorldDirection(lineOfSight)
    const target = new THREE.Vector3().copy(this.viewer.World.worldOrigin)
    const distance = target.clone().sub(this.perspectiveCamera.position)
    const depth = distance.length()
    const dims = {
      x: this.viewer.getContainer().offsetWidth,
      y: this.viewer.getContainer().offsetHeight
    }
    const aspect = dims.x / dims.y
    const fov = this.perspectiveCamera.fov
    const height = depth * 2 * Math.atan((fov * (Math.PI / 180)) / 2)
    const width = height * aspect

    this.orthographicCamera.zoom = 1
    this.orthographicCamera.left = width / -2
    this.orthographicCamera.right = width / 2
    this.orthographicCamera.top = height / 2
    this.orthographicCamera.bottom = height / -2
    this.orthographicCamera.far = this.perspectiveCamera.far
    this.orthographicCamera.near = 0.0001
    this.orthographicCamera.updateProjectionMatrix()
    this.orthographicCamera.position.copy(this.perspectiveCamera.position)
    this.orthographicCamera.quaternion.copy(this.perspectiveCamera.quaternion)
    this.orthographicCamera.updateProjectionMatrix()

    this.controls.camera = this.orthographicCamera
    this.emit(CameraControllerEvent.ProjectionChanged, CameraProjection.ORTHOGRAPHIC)
  }

  protected setupPerspectiveCamera() {
    this.controls.mouseButtons.wheel = CameraControls.ACTION.DOLLY
    this.perspectiveCamera.position.copy(this.perspectiveCamera.position)
    this.perspectiveCamera.quaternion.copy(this.perspectiveCamera.quaternion)
    this.perspectiveCamera.updateProjectionMatrix()
    this.controls.camera = this.perspectiveCamera
    this.controls.zoomTo(1)
    this.enableRotations()
    this.viewer.emiter.emit(
      CameraControllerEvent.ProjectionChanged,
      CameraProjection.PERSPECTIVE
    )
  }

  public disableRotations() {
    this.controls.mouseButtons.left = CameraControls.ACTION.TRUCK
  }

  public enableRotations() {
    this.controls.mouseButtons.left = CameraControls.ACTION.ROTATE
  }

  protected setupWASDControls() {
    const KEYCODE = { W: 87, A: 65, S: 83, D: 68 }

    const wKey = new KeyboardKeyHold(KEYCODE.W, 16.666)
    const aKey = new KeyboardKeyHold(KEYCODE.A, 16.666)
    const sKey = new KeyboardKeyHold(KEYCODE.S, 16.666)
    const dKey = new KeyboardKeyHold(KEYCODE.D, 16.666)
    const isTruckingGroup = new Array(4)

    const setTrucking = (index, value) => {
      isTruckingGroup[index] = value
      if (isTruckingGroup.every((element) => element === false)) {
        this.controls.isTrucking = false
        this.controls['dispatchEvent']({ type: 'rest' })
      } else this.controls.isTrucking = true
    }

    aKey.addEventListener(
      HOLD_EVENT_TYPE.HOLD_START,
      function () {
        this.controls.dispatchEvent({ type: 'controlstart' })
      }.bind(this)
    )
    aKey.addEventListener(
      'holding',
      function (event) {
        if (this.viewer.mouseOverRenderer === false) return
        setTrucking(0, true)
        this.controls.truck(-0.01 * event.deltaTime, 0, false)
        return
      }.bind(this)
    )
    aKey.addEventListener(
      HOLD_EVENT_TYPE.HOLD_END,
      function () {
        setTrucking(0, false)
      }.bind(this)
    )

    dKey.addEventListener(
      HOLD_EVENT_TYPE.HOLD_START,
      function () {
        this.controls.dispatchEvent({ type: 'controlstart' })
      }.bind(this)
    )
    dKey.addEventListener(
      'holding',
      function (event) {
        if (this.viewer.mouseOverRenderer === false) return
        setTrucking(1, true)
        this.controls.truck(0.01 * event.deltaTime, 0, false)
        return
      }.bind(this)
    )
    dKey.addEventListener(
      HOLD_EVENT_TYPE.HOLD_END,
      function () {
        setTrucking(1, false)
      }.bind(this)
    )

    wKey.addEventListener(
      HOLD_EVENT_TYPE.HOLD_START,
      function () {
        this.controls.dispatchEvent({ type: 'controlstart' })
      }.bind(this)
    )
    wKey.addEventListener(
      'holding',
      function (event) {
        if (this.viewer.mouseOverRenderer === false) return
        setTrucking(2, true)
        this.controls.forward(0.01 * event.deltaTime, false)
        return
      }.bind(this)
    )
    wKey.addEventListener(
      HOLD_EVENT_TYPE.HOLD_END,
      function () {
        setTrucking(2, false)
      }.bind(this)
    )

    sKey.addEventListener(
      HOLD_EVENT_TYPE.HOLD_START,
      function () {
        this.controls.dispatchEvent({ type: 'controlstart' })
      }.bind(this)
    )
    sKey.addEventListener(
      'holding',
      function (event) {
        if (this.viewer.mouseOverRenderer === false) return
        setTrucking(3, true)
        this.controls.forward(-0.01 * event.deltaTime, false)
        return
      }.bind(this)
    )
    sKey.addEventListener(
      HOLD_EVENT_TYPE.HOLD_END,
      function () {
        setTrucking(3, false)
      }.bind(this)
    )
  }

  public zoom(objectIds?: string[], fit?: number, transition?: boolean) {
    if (!objectIds) {
      this.zoomExtents(fit, transition)
      this.emit(CameraControllerEvent.Dynamic)
      //   this.pipeline.onStationaryEnd()
      return
    }
    this.zoomToBox(this.viewer.getRenderer().boxFromObjects(objectIds), fit, transition)
    this.emit(CameraControllerEvent.Dynamic)
    // this.pipeline.onStationaryEnd()
  }

  private zoomExtents(fit = 1.2, transition = true) {
    // REVISIT
    // if (this.viewer.sectionBox.display.visible) {
    //   this.zoomToBox(this.viewer.clippingVolume, 1.2, true)
    //   return
    // }
    if (this.viewer.getRenderer().allObjects.children.length === 0) {
      const box = new THREE.Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
      this.zoomToBox(box, fit, transition)
      return
    }

    const box = new THREE.Box3().setFromObject(this.viewer.getRenderer().allObjects)
    /** This is for special cases like when the stream will only have one point
     *  which three will not consider it's size when computing the bounding box
     *  resulting in a zero size bounding box. That's why we make sure the bounding
     *  box is never zero in size
     */
    if (box.min.equals(box.max)) {
      box.expandByVector(new Vector3(1, 1, 1))
    }
    this.zoomToBox(box, fit, transition)
    // this.viewer.controls.setBoundary( box )
  }

  private zoomToBox(box, fit = 1.2, transition = true) {
    if (box.max.x === Infinity || box.max.x === -Infinity) {
      box = new THREE.Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
    }
    const fitOffset = fit

    const size = box.getSize(new Vector3())
    const target = new THREE.Sphere()
    box.getBoundingSphere(target)
    target.radius = target.radius * fitOffset

    const maxSize = Math.max(size.x, size.y, size.z)
    const camFov =
      this._renderingCamera === this.perspectiveCamera ? this.fieldOfView : 55
    const camAspect =
      this._renderingCamera === this.perspectiveCamera ? this.aspect : 1.2
    const fitHeightDistance = maxSize / (2 * Math.atan((Math.PI * camFov) / 360))
    const fitWidthDistance = fitHeightDistance / camAspect
    const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance)

    this.controls.fitToSphere(target, transition)

    this.controls.minDistance = distance / 100
    this.controls.maxDistance = distance * 100
    this._renderingCamera.near = Math.max(distance / 100, 0.1)
    this._renderingCamera.far = distance * 100
    this._renderingCamera.updateProjectionMatrix()

    if (this._renderingCamera === this.orthographicCamera) {
      this._renderingCamera.far = distance * 100
      this._renderingCamera.updateProjectionMatrix()

      // fit the camera inside, so we don't have clipping plane issues.
      // WIP implementation
      const camPos = this._renderingCamera.position
      let dist = target.distanceToPoint(camPos)
      if (dist < 0) {
        dist *= -1
        this.controls.setPosition(camPos.x + dist, camPos.y + dist, camPos.z + dist)
      }
    }
  }

  private isSpeckleView(
    view: CanonicalView | SpeckleView | InlineView | PolarView
  ): view is SpeckleView {
    return (view as SpeckleView).name !== undefined
  }

  private isCanonicalView(
    view: CanonicalView | SpeckleView | InlineView | PolarView
  ): view is CanonicalView {
    return typeof (view as CanonicalView) === 'string'
  }

  private isInlineView(
    view: CanonicalView | SpeckleView | InlineView | PolarView
  ): view is InlineView {
    return (
      (view as InlineView).position !== undefined &&
      (view as InlineView).target !== undefined
    )
  }

  private isPolarView(
    view: CanonicalView | SpeckleView | InlineView | PolarView
  ): view is PolarView {
    return (
      (view as PolarView).azimuth !== undefined &&
      (view as PolarView).polar !== undefined
    )
  }

  public setView(
    view: CanonicalView | SpeckleView | InlineView | PolarView,
    transition = true
  ): void {
    if (this.isSpeckleView(view)) {
      this.setViewSpeckle(view, transition)
    }
    if (this.isCanonicalView(view)) {
      this.setViewCanonical(view, transition)
    }
    if (this.isInlineView(view)) {
      this.setViewInline(view, transition)
    }
    if (this.isPolarView(view)) {
      this.setViewPolar(view, transition)
    }
    // this.pipeline.onStationaryEnd()
    this.emit(CameraControllerEvent.Dynamic)
  }

  private setViewSpeckle(view: SpeckleView, transition = true) {
    this.controls.setLookAt(
      view.view.origin['x'],
      view.view.origin['y'],
      view.view.origin['z'],
      view.view.target['x'],
      view.view.target['y'],
      view.view.target['z'],
      transition
    )
    this.enableRotations()
  }

  /**
   * Rotates camera to some canonical views
   * @param  {string}  side       Can be any of front, back, up (top), down (bottom), right, left.
   * @param  {Number}  fit        [description]
   * @param  {Boolean} transition [description]
   * @return {[type]}             [description]
   */
  private setViewCanonical(side: string, transition = true) {
    const DEG90 = Math.PI * 0.5
    const DEG180 = Math.PI

    switch (side) {
      case 'front':
        this.zoomExtents()
        this.controls.rotateTo(0, DEG90, transition)
        if (this._renderingCamera === this.orthographicCamera) this.disableRotations()
        break

      case 'back':
        this.zoomExtents()
        this.controls.rotateTo(DEG180, DEG90, transition)
        if (this._renderingCamera === this.orthographicCamera) this.disableRotations()
        break

      case 'up':
      case 'top':
        this.zoomExtents()
        this.controls.rotateTo(0, 0, transition)
        if (this._renderingCamera === this.orthographicCamera) this.disableRotations()
        break

      case 'down':
      case 'bottom':
        this.zoomExtents()
        this.controls.rotateTo(0, DEG180, transition)
        if (this._renderingCamera === this.orthographicCamera) this.disableRotations()
        break

      case 'right':
        this.zoomExtents()
        this.controls.rotateTo(DEG90, DEG90, transition)
        if (this._renderingCamera === this.orthographicCamera) this.disableRotations()
        break

      case 'left':
        this.zoomExtents()
        this.controls.rotateTo(-DEG90, DEG90, transition)
        if (this._renderingCamera === this.orthographicCamera) this.disableRotations()
        break

      case '3d':
      case '3D':
      default: {
        let box
        if (this.viewer.getRenderer().allObjects.children.length === 0)
          box = new THREE.Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
        else box = new THREE.Box3().setFromObject(this.viewer.getRenderer().allObjects)
        if (box.max.x === Infinity || box.max.x === -Infinity) {
          box = new THREE.Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
        }
        this.controls.setPosition(box.max.x, box.max.y, box.max.z, transition)
        this.zoomExtents()
        this.enableRotations()
        break
      }
    }
  }

  private setViewInline(view: InlineView, transition = true) {
    this.controls.setLookAt(
      view.position.x,
      view.position.y,
      view.position.z,
      view.target.x,
      view.target.y,
      view.target.z,
      transition
    )
    this.enableRotations()
  }

  private setViewPolar(view: PolarView, transition = true) {
    this.controls.rotate(view.azimuth, view.polar, transition)
    this.enableRotations()
  }
}
