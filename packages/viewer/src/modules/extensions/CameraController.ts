import { Extension } from './Extension.js'
import {
  Box3,
  Camera,
  MathUtils,
  OrthographicCamera,
  PerspectiveCamera,
  Quaternion,
  Sphere,
  Vector2,
  Vector3
} from 'three'

import { CameraProjection, type CameraEventPayload } from '../objects/SpeckleCamera.js'
import { CameraEvent, type SpeckleCamera } from '../objects/SpeckleCamera.js'
import { FlyControls, FlyControlsOptions } from './controls/FlyControls.js'
import { SpeckleControls } from './controls/SpeckleControls.js'
import Logger from '../utils/Logger.js'
import { GeometryType } from '../batching/Batch.js'
import { IViewer, SpeckleView, UpdateFlags } from '../../IViewer.js'
import {
  SmoothOrbitControlsOptions,
  SmoothOrbitControls
} from './controls/SmoothOrbitControls.js'

// const UP: Vector3 = new Vector3(0, 1, 0)
// const quatBuff = new Quaternion()

export enum NearPlaneCalculation {
  EMPIRIC,
  ACCURATE
}

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

export type CameraControllerOptions = SmoothOrbitControlsOptions &
  FlyControlsOptions & { nearPlaneCalculation?: NearPlaneCalculation }

export function isPerspectiveCamera(camera: Camera): camera is PerspectiveCamera {
  return (camera as PerspectiveCamera).isPerspectiveCamera
}

export function isOrthographicCamera(camera: Camera): camera is OrthographicCamera {
  return (camera as OrthographicCamera).isOrthographicCamera
}

export function computeOrthographicSize(
  distance: number,
  fov: number,
  aspect: number
): Vector2 {
  const height = Math.tan(MathUtils.DEG2RAD * (fov / 2)) * 2.0 * distance
  const width = height * aspect
  return new Vector2(width, height)
}

export const DefaultOrbitControlsOptions: Required<CameraControllerOptions> = {
  enableOrbit: true,
  enableZoom: true,
  enablePan: true,
  orbitSensitivity: 1,
  zoomSensitivity: 1,
  panSensitivity: 1,
  inputSensitivity: 1,
  minimumRadius: 0,
  maximumRadius: Infinity,
  minimumPolarAngle: 0,
  maximumPolarAngle: Math.PI,
  minimumAzimuthalAngle: -Infinity,
  maximumAzimuthalAngle: Infinity,
  minimumFieldOfView: 40,
  maximumFieldOfView: 60,
  touchAction: 'none',
  infiniteZoom: true,
  zoomToCursor: true,
  lookSpeed: 1,
  moveSpeed: 1,
  damperDecay: 30,
  enableLook: true,
  nearPlaneCalculation: NearPlaneCalculation.EMPIRIC
}

export class CameraController extends Extension implements SpeckleCamera {
  protected _renderingCamera: PerspectiveCamera | OrthographicCamera
  protected perspectiveCamera: PerspectiveCamera
  protected orthographicCamera: OrthographicCamera
  protected _lastCameraChanged: boolean = false
  protected _options: Required<CameraControllerOptions> = DefaultOrbitControlsOptions
  protected _activeControls: SpeckleControls
  protected _controlsList: SpeckleControls[] = []

  get renderingCamera(): PerspectiveCamera | OrthographicCamera {
    return this._renderingCamera
  }

  set renderingCamera(value: PerspectiveCamera | OrthographicCamera) {
    this._renderingCamera = value
  }

  public get enabled() {
    return this._activeControls.enabled
  }

  public set enabled(val) {
    this.controls.enabled = val
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

  public get controls(): SpeckleControls {
    return this._activeControls
  }

  public get options(): Required<CameraControllerOptions> {
    return this._options
  }

  public set options(value: CameraControllerOptions) {
    Object.assign(this._options, value)
    this._controlsList.forEach((controls: SpeckleControls) => {
      controls.options = value
    })
  }

  public constructor(viewer: IViewer) {
    super(viewer)

    /** Create the default perspective camera */
    this.perspectiveCamera = new PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight
    )

    const aspect =
      this.viewer.getContainer().offsetWidth / this.viewer.getContainer().offsetHeight

    /** Create the default orthographic camera */
    const fustrumSize = 50
    this.orthographicCamera = new OrthographicCamera(
      (-fustrumSize * aspect) / 2,
      (fustrumSize * aspect) / 2,
      fustrumSize / 2,
      -fustrumSize / 2,
      0.001,
      10000
    )

    /** Perspective camera as default on startup */
    this.renderingCamera = this.perspectiveCamera

    const flyControls = new FlyControls(
      this._renderingCamera,
      this.viewer.getContainer(),
      this.viewer.World,
      this._options
    )
    flyControls.enabled = false
    flyControls.setDamperDecayTime(30)
    flyControls.up = new Vector3(0, 0, 1)

    const orbitControls = new SmoothOrbitControls(
      this.perspectiveCamera,
      this.viewer.getContainer(),
      this.viewer.World,
      this.viewer.getRenderer().scene,
      this.viewer.getRenderer().intersections,
      this._options
    )
    orbitControls.enabled = true

    this.viewer.getRenderer().speckleCamera = this

    this._controlsList.push(orbitControls)
    this._controlsList.push(flyControls)

    this._activeControls = orbitControls

    this.default()
  }

  public default() {
    if (this._activeControls instanceof SmoothOrbitControls) {
      this._activeControls.up = new Vector3(0, 0, 1)
      this._activeControls.setOrbit(2.356, 0.955)
      this._activeControls.jumpToGoal()
    }
  }

  public on<T extends CameraEvent>(
    eventType: T,
    listener: (arg: CameraEventPayload[T]) => void
  ): void {
    super.on(eventType, listener)
  }

  public getTarget(): Vector3 {
    return this._activeControls.getTarget()
  }

  public getPosition(): Vector3 {
    return this._activeControls.getPosition()
  }

  public toggleControls() {
    const oldControls: SpeckleControls = this._activeControls
    let newControls: SpeckleControls | undefined = undefined

    if (this._activeControls instanceof SmoothOrbitControls) {
      newControls = this._controlsList[1]
    } else if (this._activeControls instanceof FlyControls) {
      newControls = this._controlsList[0]
    }

    if (!newControls) throw new Error('Not controls found!')

    oldControls.enabled = false
    newControls.enabled = true
    newControls.fromPositionAndTarget(
      oldControls.getPosition(),
      oldControls.getTarget()
    )
    newControls.jumpToGoal()
    this._activeControls = newControls
    this.viewer.requestRender()
  }

  public setCameraView(
    objectIds: string[] | undefined,
    transition: boolean | undefined,
    fit?: number
  ): void
  public setCameraView(
    view: CanonicalView | SpeckleView | InlineView | PolarView,
    transition: boolean | undefined,
    fit?: number
  ): void
  public setCameraView(
    bounds: Box3,
    transition: boolean | undefined,
    fit?: number
  ): void
  public setCameraView(
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

  public onEarlyUpdate() {
    const changed = this._activeControls.update()
    if (changed !== this._lastCameraChanged) {
      this.emit(changed ? CameraEvent.Dynamic : CameraEvent.Stationary)
    }
    this.emit(CameraEvent.FrameUpdate, changed)
    this._lastCameraChanged = changed

    if (changed) {
      this.updateCameraPlanes()
    }
  }

  public onLateUpdate(): void {
    this.emit(CameraEvent.LateFrameUpdate, this._lastCameraChanged)
  }

  public onResize() {
    const aspect =
      this.viewer.getContainer().offsetWidth / this.viewer.getContainer().offsetHeight
    this.perspectiveCamera.aspect = aspect
    this.perspectiveCamera.updateProjectionMatrix()

    const distance = this._activeControls
      .getPosition()
      .distanceTo(this._activeControls.getTarget())
    const orthographicSize = computeOrthographicSize(
      distance,
      this.perspectiveCamera.fov,
      aspect
    )
    this.orthographicCamera.zoom = 1
    this.orthographicCamera.left = orthographicSize.x / -2
    this.orthographicCamera.right = orthographicSize.x / 2
    this.orthographicCamera.top = orthographicSize.y / 2
    this.orthographicCamera.bottom = orthographicSize.y / -2
    this.orthographicCamera.updateProjectionMatrix()
  }

  public setPerspectiveCameraOn() {
    if (this._renderingCamera === this.perspectiveCamera) return
    this.renderingCamera = this.perspectiveCamera
    this.setupPerspectiveCamera()
    this.viewer.requestRender(UpdateFlags.RENDER_RESET)
  }

  public setOrthoCameraOn(): void {
    if (this._renderingCamera === this.orthographicCamera) return
    this.renderingCamera = this.orthographicCamera
    this.setupOrthoCamera()
    this.viewer.requestRender(UpdateFlags.RENDER_RESET)
  }

  public toggleCameras(): void {
    if (this._renderingCamera === this.perspectiveCamera) this.setOrthoCameraOn()
    else this.setPerspectiveCameraOn()
  }

  protected setupOrthoCamera() {
    this.controls.targetCamera = this.orthographicCamera
    this.enableRotations()
    this.updateCameraPlanes(this.viewer.getRenderer().sceneBox)
    this.emit(CameraEvent.ProjectionChanged, CameraProjection.ORTHOGRAPHIC)
  }

  protected setupPerspectiveCamera() {
    this.controls.targetCamera = this.perspectiveCamera
    this.enableRotations()
    this.updateCameraPlanes(this.viewer.getRenderer().sceneBox)
    this.emit(CameraEvent.ProjectionChanged, CameraProjection.PERSPECTIVE)
  }

  public disableRotations() {
    this.options = { enableOrbit: false, enableLook: false }
  }

  public enableRotations() {
    this.options = { enableOrbit: true, enableLook: true }
  }

  public updateCameraPlanes(targetVolume?: Box3, offsetScale: number = 1) {
    const renderer = this.viewer.getRenderer()
    if (!renderer.renderingCamera) return

    if (!targetVolume) targetVolume = this.viewer.getRenderer().sceneBox
    let nearPlane = this.computeNearCameraPlaneEmpiric(targetVolume, offsetScale)
    if (this._options.nearPlaneCalculation === NearPlaneCalculation.ACCURATE)
      nearPlane = this.computeNearCameraPlaneAccurate(
        targetVolume,
        offsetScale,
        nearPlane
      )
    if (nearPlane) {
      renderer.renderingCamera.near = nearPlane
      renderer.renderingCamera.updateProjectionMatrix()
    }
    this.updateFarCameraPlane()
  }

  protected computeNearCameraPlaneEmpiric(
    targetVolume?: Box3,
    offsetScale: number = 1
  ): number | undefined {
    if (!targetVolume) return

    if (targetVolume.isEmpty()) {
      Logger.warn('Cannot set camera planes for empty volume')
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

    return this.perspectiveCamera ? distance / 100 : 0.001
  }

  protected computeNearCameraPlaneAccurate(
    targetVolume?: Box3,
    offsetScale: number = 1,
    fallback?: number
  ): number | undefined {
    const minDist = this.getClosestGeometryDistance(fallback)
    if (minDist === Number.POSITIVE_INFINITY) {
      return this.computeNearCameraPlaneEmpiric(targetVolume, offsetScale)
    }

    const camFov =
      this._renderingCamera === this.perspectiveCamera ? this.fieldOfView : 55
    const camAspect =
      this._renderingCamera === this.perspectiveCamera ? this.aspect : 1.2
    const nearPlane =
      Math.max(minDist, 0) /
      Math.sqrt(
        1 +
          Math.pow(Math.tan(((camFov / 180) * Math.PI) / 2), 2) *
            (Math.pow(camAspect, 2) + 1)
      )
    // console.log(minDist, nearPlane)
    return nearPlane
  }

  protected updateFarCameraPlane() {
    const renderer = this.viewer.getRenderer()
    if (!renderer.renderingCamera) return

    const v = new Vector3()
    const box = renderer.sceneBox
    const camPos = new Vector3().copy(renderer.renderingCamera.position)
    let d = 0
    v.set(box.min.x, box.min.y, box.min.z) // 000
    d = Math.max(camPos.distanceTo(v), d)
    v.set(box.min.x, box.min.y, box.max.z) // 001
    d = Math.max(camPos.distanceTo(v), d)
    v.set(box.min.x, box.max.y, box.min.z) // 010
    d = Math.max(camPos.distanceTo(v), d)
    v.set(box.min.x, box.max.y, box.max.z) // 011
    d = Math.max(camPos.distanceTo(v), d)
    v.set(box.max.x, box.min.y, box.min.z) // 100
    d = Math.max(camPos.distanceTo(v), d)
    v.set(box.max.x, box.min.y, box.max.z) // 101
    d = Math.max(camPos.distanceTo(v), d)
    v.set(box.max.x, box.max.y, box.min.z) // 110
    d = Math.max(camPos.distanceTo(v), d)
    v.set(box.max.x, box.max.y, box.max.z) // 111
    d = Math.max(camPos.distanceTo(v), d)
    renderer.renderingCamera.far = d * 2
    renderer.renderingCamera.updateProjectionMatrix()
  }

  protected getClosestGeometryDistance(fallback?: number): number {
    const cameraPosition = this._renderingCamera.position
    const cameraTarget = this.getTarget()
    const cameraDir = new Vector3().subVectors(cameraTarget, cameraPosition).normalize()

    const batches = this.viewer
      .getRenderer()
      .batcher.getBatches(undefined, GeometryType.MESH)
    let minDist = Number.POSITIVE_INFINITY
    for (let b = 0; b < batches.length; b++) {
      const result = batches[b].mesh.TAS.closestPointToPointHalfplane(
        cameraPosition,
        cameraDir,
        fallback
      )
      if (!result) continue
      minDist = Math.min(minDist, result.distance)
    }
    return minDist
  }

  protected zoom(objectIds?: string[], fit?: number, transition?: boolean) {
    if (!objectIds) {
      this.zoomExtents(fit, transition)
      return
    }
    this.zoomToBox(this.viewer.getRenderer().boxFromObjects(objectIds), fit, transition)
  }

  protected zoomExtents(fit = 1.2, transition = true) {
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
  }

  protected zoomToBox(box: Box3, fit = 1.2, transition = true) {
    if (box.max.x === Infinity || box.max.x === -Infinity) {
      box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
    }

    const targetSphere = new Sphere()
    box.getBoundingSphere(targetSphere)
    targetSphere.radius = this.fitToRadius(targetSphere.radius) * fit
    this._activeControls.fitToSphere(targetSphere)

    this.updateCameraPlanes(box, fit)

    if (!transition) {
      this._activeControls.jumpToGoal()
    }
  }

  protected fitToRadius(radius: number) {
    // https://stackoverflow.com/a/44849975
    const vFOV = this.perspectiveCamera.getEffectiveFOV() * MathUtils.DEG2RAD
    const hFOV = Math.atan(Math.tan(vFOV * 0.5) * this.perspectiveCamera.aspect) * 2
    const fov = 1 < this.perspectiveCamera.aspect ? vFOV : hFOV
    return radius / Math.sin(fov * 0.5)
  }

  protected isSpeckleView(
    view: CanonicalView | SpeckleView | InlineView | PolarView
  ): view is SpeckleView {
    return (view as SpeckleView).name !== undefined
  }

  protected isCanonicalView(
    view: CanonicalView | SpeckleView | InlineView | PolarView
  ): view is CanonicalView {
    return typeof (view as CanonicalView) === 'string'
  }

  protected isInlineView(
    view: CanonicalView | SpeckleView | InlineView | PolarView
  ): view is InlineView {
    return (
      (view as InlineView).position !== undefined &&
      (view as InlineView).target !== undefined
    )
  }

  protected isPolarView(
    view: CanonicalView | SpeckleView | InlineView | PolarView
  ): view is PolarView {
    return (
      (view as PolarView).azimuth !== undefined &&
      (view as PolarView).polar !== undefined
    )
  }

  protected isBox3(
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

  protected setViewSpeckle(view: SpeckleView, transition = true) {
    this._activeControls.fromPositionAndTarget(
      new Vector3(view.origin.x, view.origin.y, view.origin.z),
      new Vector3(view.target.x, view.target.y, view.target.z)
    )
    if (!transition) this._activeControls.jumpToGoal()

    this.enableRotations()
  }

  /**
   * Rotates camera to some canonical views
   * @param  {string}  side       Can be any of front, back, up (top), down (bottom), right, left.
   * @param  {Number}  fit        [description]
   * @param  {Boolean} transition [description]
   * @return {[type]}             [description]
   */
  protected setViewCanonical(side: string, transition = true) {
    const targetSphere = new Sphere()
    this.viewer.World.worldBox.getBoundingSphere(targetSphere)
    const distance = this.fitToRadius(targetSphere.radius)

    const canonicalPosition = new Vector3().copy(
      this.viewer.World.worldBox.getCenter(new Vector3())
    )

    const canonicalTarget = new Vector3().copy(canonicalPosition)
    const controlerBasis = new Quaternion().setFromUnitVectors(
      new Vector3(0, 1, 0),
      this._activeControls.up
    )
    switch (side) {
      case 'front':
        this._activeControls.fromPositionAndTarget(
          canonicalPosition.add(
            new Vector3(0, 0, 1)
              .applyQuaternion(controlerBasis)
              .multiplyScalar(distance)
          ),
          canonicalTarget
        )
        if (this._renderingCamera === this.orthographicCamera) this.disableRotations()
        break

      case 'back':
        this._activeControls.fromPositionAndTarget(
          canonicalPosition.add(
            new Vector3(0, 0, -1)
              .applyQuaternion(controlerBasis)
              .multiplyScalar(distance)
          ),
          canonicalTarget
        )
        if (this._renderingCamera === this.orthographicCamera) this.disableRotations()
        break

      case 'up':
      case 'top':
        this._activeControls.fromPositionAndTarget(
          canonicalPosition.add(
            new Vector3(0, 1, 0)
              .applyQuaternion(controlerBasis)
              .multiplyScalar(distance)
          ),
          canonicalTarget
        )
        if (this._renderingCamera === this.orthographicCamera) this.disableRotations()
        break

      case 'down':
      case 'bottom':
        this._activeControls.fromPositionAndTarget(
          canonicalPosition.add(
            new Vector3(0, -1, 0)
              .applyQuaternion(controlerBasis)
              .multiplyScalar(distance)
          ),
          canonicalTarget
        )
        if (this._renderingCamera === this.orthographicCamera) this.disableRotations()
        break

      case 'right':
        this._activeControls.fromPositionAndTarget(
          canonicalPosition.add(
            new Vector3(1, 0, 0)
              .applyQuaternion(controlerBasis)
              .multiplyScalar(distance)
          ),
          canonicalTarget
        )
        if (this._renderingCamera === this.orthographicCamera) this.disableRotations()
        break

      case 'left':
        this._activeControls.fromPositionAndTarget(
          canonicalPosition.add(
            new Vector3(-1, 0, 0)
              .applyQuaternion(controlerBasis)
              .multiplyScalar(distance)
          ),
          canonicalTarget
        )
        if (this._renderingCamera === this.orthographicCamera) this.disableRotations()
        break

      case '3d':
      case '3D':
      default: {
        this.enableRotations()
        break
      }
    }
    if (!transition) this._activeControls.jumpToGoal()
  }

  protected setViewInline(view: InlineView, transition = true) {
    this._activeControls.fromPositionAndTarget(view.position, view.target)
    if (!transition) this._activeControls.jumpToGoal()

    this.enableRotations()
  }

  private setViewPolar(view: PolarView, transition = true) {
    ;(this._activeControls as SmoothOrbitControls).adjustOrbit(
      view.azimuth,
      view.polar,
      view.radius ? view.radius : 0
    )
    if (!transition) this._activeControls.jumpToGoal()
    this.enableRotations()
  }
}
