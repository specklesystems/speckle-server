import * as THREE from 'three'
import CameraControls from 'camera-controls'
import { Extension } from './Extension'
import { SpeckleCameraControls } from '../objects/SpeckleCameraControls'
import { Box3, OrthographicCamera, PerspectiveCamera, Sphere, Vector3 } from 'three'
import { KeyboardKeyHold, HOLD_EVENT_TYPE } from 'hold-event'
import { CameraProjection, type CameraEventPayload } from '../objects/SpeckleCamera'
import { CameraEvent, type SpeckleCamera } from '../objects/SpeckleCamera'
import Logger from 'js-logger'
import type { IViewer, SpeckleView } from '../../IViewer'

export type CanonicalView =
  | 'front'
  | 'back'
  | 'up'
  | 'top'
  | 'down'
  | 'bottom'
  | 'right'
  | 'left'
  | '3d'
  | '3D'

export type InlineView = {
  position: Vector3
  target: Vector3
}
export type PolarView = {
  azimuth: number
  polar: number
  radius?: number
  origin?: Vector3
}

export class CameraController extends Extension implements SpeckleCamera {
  protected _renderingCamera!: PerspectiveCamera | OrthographicCamera
  protected perspectiveCamera: PerspectiveCamera
  protected orthographicCamera: OrthographicCamera
  protected _controls: SpeckleCameraControls

  get renderingCamera(): PerspectiveCamera | OrthographicCamera {
    return this._renderingCamera
  }

  set renderingCamera(value: PerspectiveCamera | OrthographicCamera) {
    this._renderingCamera = value
  }

  public get enabled(): boolean {
    return this._controls.enabled
  }

  public set enabled(val: boolean) {
    this._controls.enabled = val
  }

  public get fieldOfView(): number {
    return this.perspectiveCamera.fov
  }

  public set fieldOfView(value: number) {
    this.perspectiveCamera.fov = value
    this.perspectiveCamera.updateProjectionMatrix()
  }

  public get aspect(): number {
    return this.perspectiveCamera.aspect
  }

  public get controls(): SpeckleCameraControls {
    return this._controls
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
    this._controls = new SpeckleCameraControls(
      this.perspectiveCamera,
      this.viewer.getContainer()
    )
    this._controls.maxPolarAngle = Math.PI / 2
    this._controls.restThreshold = 0.001
    this.setupWASDControls()

    this._controls.addEventListener('rest', () => {
      this.emit(CameraEvent.Stationary)
    })
    this._controls.addEventListener('controlstart', () => {
      this.emit(CameraEvent.Dynamic)
    })

    this._controls.addEventListener('controlend', () => {
      if (this._controls.hasRested) this.emit(CameraEvent.Stationary)
    })

    this._controls.addEventListener('control', () => {
      this.emit(CameraEvent.Dynamic)
    })

    this.viewer.getRenderer().speckleCamera = this
  }

  public on<T extends CameraEvent>(
    eventType: T,
    listener: (arg: CameraEventPayload[T]) => void
  ): void {
    super.on(eventType, listener)
  }

  setCameraView(
    objectIds: string[] | undefined,
    transition: boolean | undefined,
    fit?: number
  ): void
  setCameraView(
    view: CanonicalView | SpeckleView | InlineView | PolarView,
    transition: boolean | undefined,
    fit?: number
  ): void
  setCameraView(bounds: Box3, transition: boolean | undefined, fit?: number): void
  setCameraView(
    arg0:
      | string[]
      | CanonicalView
      | SpeckleView
      | InlineView
      | PolarView
      | Box3
      | undefined,
    arg1 = true,
    arg2 = 1.2
  ): void {
    if (!arg0) {
      this.zoomExtents(arg2, arg1)
    } else if (Array.isArray(arg0)) {
      this.zoom(arg0, arg2, arg1)
    } else if (this.isBox3(arg0)) {
      this.zoomToBox(arg0, arg2, arg1)
    } else {
      this.setView(arg0, arg1)
    }
    this.emit(CameraEvent.Dynamic)
  }

  public onEarlyUpdate(deltaTime: number) {
    const changed = this._controls.update(deltaTime)
    this.emit(CameraEvent.FrameUpdate, changed)
  }

  public onResize() {
    this.perspectiveCamera.aspect =
      this.viewer.getContainer().offsetWidth / this.viewer.getContainer().offsetHeight
    this.perspectiveCamera.updateProjectionMatrix()

    const lineOfSight = new Vector3()
    this.perspectiveCamera.getWorldDirection(lineOfSight)
    const target = new Vector3()
    this._controls.getTarget(target)
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

  public setOrthoCameraOn(): void {
    if (this._renderingCamera === this.orthographicCamera) return
    this.renderingCamera = this.orthographicCamera
    this.setupOrthoCamera()
    this.viewer.requestRender()
  }

  public toggleCameras(): void {
    if (this._renderingCamera === this.perspectiveCamera) this.setOrthoCameraOn()
    else this.setPerspectiveCameraOn()
  }

  protected setupOrthoCamera(): void {
    this._controls.mouseButtons.wheel = CameraControls.ACTION.ZOOM

    const lineOfSight = new Vector3()
    this.perspectiveCamera.getWorldDirection(lineOfSight)
    const target = new Vector3().copy(this.viewer.World.worldOrigin)
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

    this._controls.camera = this.orthographicCamera
    this.setCameraPlanes(this.viewer.getRenderer().sceneBox)
    this.emit(CameraEvent.ProjectionChanged, CameraProjection.ORTHOGRAPHIC)
  }

  protected setupPerspectiveCamera() {
    this._controls.mouseButtons.wheel = CameraControls.ACTION.DOLLY
    this.perspectiveCamera.position.copy(this.perspectiveCamera.position)
    this.perspectiveCamera.quaternion.copy(this.perspectiveCamera.quaternion)
    this.perspectiveCamera.updateProjectionMatrix()
    this._controls.camera = this.perspectiveCamera
    this._controls.zoomTo(1)
    this.enableRotations()
    this.setCameraPlanes(this.viewer.getRenderer().sceneBox)
    this.emit(CameraEvent.ProjectionChanged, CameraProjection.PERSPECTIVE)
  }

  public disableRotations(): void {
    this._controls.mouseButtons.left = CameraControls.ACTION.TRUCK
  }

  public enableRotations(): void {
    this._controls.mouseButtons.left = CameraControls.ACTION.ROTATE
  }

  protected setupWASDControls() {
    const KEYCODE = { W: 87, A: 65, S: 83, D: 68 }

    const wKey = new KeyboardKeyHold(KEYCODE.W, 16.666)
    const aKey = new KeyboardKeyHold(KEYCODE.A, 16.666)
    const sKey = new KeyboardKeyHold(KEYCODE.S, 16.666)
    const dKey = new KeyboardKeyHold(KEYCODE.D, 16.666)
    const isTruckingGroup = new Array(4)

    const setTrucking = (index: number, value: boolean) => {
      isTruckingGroup[index] = value
      if (isTruckingGroup.every((element) => element === false)) {
        this._controls.isTrucking = false
        this._controls['dispatchEvent']({ type: 'rest' })
      } else this._controls.isTrucking = true
    }

    aKey.addEventListener(HOLD_EVENT_TYPE.HOLD_START, () => {
      this.controls['dispatchEvent']({ type: 'controlstart' })
    })
    aKey.addEventListener('holding', (event) => {
      if (!event) return
      setTrucking(0, true)
      this.controls.truck(-0.01 * event.deltaTime, 0, false)
      return
    })
    aKey.addEventListener(
      HOLD_EVENT_TYPE.HOLD_END,
      function () {
        setTrucking(0, false)
      }.bind(this)
    )

    dKey.addEventListener(HOLD_EVENT_TYPE.HOLD_START, () => {
      this.controls['dispatchEvent']({ type: 'controlstart' })
    })
    dKey.addEventListener('holding', (event) => {
      if (!event) return
      setTrucking(1, true)
      this.controls.truck(0.01 * event.deltaTime, 0, false)
      return
    })
    dKey.addEventListener(
      HOLD_EVENT_TYPE.HOLD_END,
      function () {
        setTrucking(1, false)
      }.bind(this)
    )

    wKey.addEventListener(HOLD_EVENT_TYPE.HOLD_START, () => {
      this.controls['dispatchEvent']({ type: 'controlstart' })
    })
    wKey.addEventListener('holding', (event) => {
      if (!event) return
      setTrucking(2, true)
      this.controls.forward(0.01 * event.deltaTime, false)
      return
    })
    wKey.addEventListener(
      HOLD_EVENT_TYPE.HOLD_END,
      function () {
        setTrucking(2, false)
      }.bind(this)
    )

    sKey.addEventListener(HOLD_EVENT_TYPE.HOLD_START, () => {
      this.controls['dispatchEvent']({ type: 'controlstart' })
    })
    sKey.addEventListener('holding', (event) => {
      if (!event) return
      setTrucking(3, true)
      this.controls.forward(-0.01 * event.deltaTime, false)
      return
    })
    sKey.addEventListener(
      HOLD_EVENT_TYPE.HOLD_END,
      function () {
        setTrucking(3, false)
      }.bind(this)
    )
  }

  public setCameraPlanes(targetVolume: Box3, offsetScale: number = 1) {
    if (targetVolume.isEmpty()) {
      Logger.error('Cannot set camera planes for empty volume')
      return
    }

    const size = targetVolume.getSize(new Vector3())
    const maxSize = Math.max(size.x, size.y, size.z)
    const camFov =
      this._renderingCamera === this.perspectiveCamera ? this.fieldOfView : 55
    const camAspect =
      this._renderingCamera === this.perspectiveCamera ? this.aspect : 1.2
    const fitHeightDistance = maxSize / (2 * Math.atan((Math.PI * camFov) / 360))
    const fitWidthDistance = fitHeightDistance / camAspect
    const distance = offsetScale * Math.max(fitHeightDistance, fitWidthDistance)

    this._controls.minDistance = distance / 100
    this._controls.maxDistance = distance * 100

    this._renderingCamera.near = distance / 100
    this._renderingCamera.far = distance * 100
    this._renderingCamera.updateProjectionMatrix()
  }

  protected zoom(objectIds?: string[], fit?: number, transition?: boolean) {
    if (!objectIds) {
      this.zoomExtents(fit, transition)
      return
    }
    this.zoomToBox(this.viewer.getRenderer().boxFromObjects(objectIds), fit, transition)
  }

  private zoomExtents(fit = 1.2, transition = true) {
    if (this.viewer.getRenderer().clippingVolume.isEmpty()) {
      const box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
      this.zoomToBox(box, fit, transition)
      return
    }

    const box = this.viewer.getRenderer().clippingVolume
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

  private zoomToBox(box: Box3, fit = 1.2, transition = true) {
    if (box.max.x === Infinity || box.max.x === -Infinity) {
      box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
    }

    const target = new Sphere()
    box.getBoundingSphere(target)
    target.radius = target.radius * fit
    this._controls.fitToSphere(target, transition)

    this.setCameraPlanes(box, fit)

    if (this._renderingCamera === this.orthographicCamera) {
      // fit the camera inside, so we don't have clipping plane issues.
      // WIP implementation
      const camPos = this._renderingCamera.position
      let dist = target.distanceToPoint(camPos)
      if (dist < 0) {
        dist *= -1
        this._controls.setPosition(camPos.x + dist, camPos.y + dist, camPos.z + dist)
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

  private isBox3(
    view: CanonicalView | SpeckleView | InlineView | PolarView | Box3
  ): view is Box3 {
    return view instanceof Box3
  }

  protected setView(
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
  }

  private setViewSpeckle(view: SpeckleView, transition = true) {
    this._controls.setLookAt(
      view.origin.x,
      view.origin.y,
      view.origin.z,
      view.target.x,
      view.target.y,
      view.target.z,
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
        this._controls.rotateTo(0, DEG90, transition)
        if (this._renderingCamera === this.orthographicCamera) this.disableRotations()
        break

      case 'back':
        this.zoomExtents()
        this._controls.rotateTo(DEG180, DEG90, transition)
        if (this._renderingCamera === this.orthographicCamera) this.disableRotations()
        break

      case 'up':
      case 'top':
        this.zoomExtents()
        this._controls.rotateTo(0, 0, transition)
        if (this._renderingCamera === this.orthographicCamera) this.disableRotations()
        break

      case 'down':
      case 'bottom':
        this.zoomExtents()
        this._controls.rotateTo(0, DEG180, transition)
        if (this._renderingCamera === this.orthographicCamera) this.disableRotations()
        break

      case 'right':
        this.zoomExtents()
        this._controls.rotateTo(DEG90, DEG90, transition)
        if (this._renderingCamera === this.orthographicCamera) this.disableRotations()
        break

      case 'left':
        this.zoomExtents()
        this._controls.rotateTo(-DEG90, DEG90, transition)
        if (this._renderingCamera === this.orthographicCamera) this.disableRotations()
        break

      case '3d':
      case '3D':
      default: {
        let box
        if (this.viewer.getRenderer().allObjects.children.length === 0)
          box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
        else box = new Box3().setFromObject(this.viewer.getRenderer().allObjects)
        if (box.max.x === Infinity || box.max.x === -Infinity) {
          box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
        }
        this._controls.setPosition(box.max.x, box.max.y, box.max.z, transition)
        this.zoomExtents()
        this.enableRotations()
        break
      }
    }
  }

  private setViewInline(view: InlineView, transition = true) {
    this._controls.setLookAt(
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
    this._controls.rotate(view.azimuth, view.polar, transition)
    this.enableRotations()
  }
}
