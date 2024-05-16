/* @license
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  Euler,
  Event as ThreeEvent,
  Matrix3,
  Spherical,
  Vector2,
  Vector3,
  Object3D,
  WebGLRenderer,
  PerspectiveCamera,
  Box3,
  Sphere,
  Matrix4,
  MathUtils,
  Scene,
  Mesh,
  SphereGeometry,
  MeshBasicMaterial,
  OrthographicCamera
} from 'three'

import { Damper, SETTLING_TIME } from '../../utils/Damper.js'

import EventEmitter from '../../EventEmitter.js'
import { ObjectLayers } from '../../../IViewer.js'
import { World } from '../../World.js'

/**
 * @param {Number} value
 * @param {Number} lowerLimit
 * @param {Number} upperLimit
 * @return {Number} value clamped within lowerLimit..upperLimit
 */
const clamp = (value: number, lowerLimit: number, upperLimit: number): number =>
  Math.max(lowerLimit, Math.min(upperLimit, value))

const PAN_SENSITIVITY = 0.018
// const TAP_DISTANCE = 2
// const TAP_MS = 300
// const vector2 = new Vector2()
const vector3 = new Vector3()

export type TouchMode = null | ((dx: number, dy: number) => void)
export type TouchAction = 'pan-y' | 'pan-x' | 'none'

export interface Pointer {
  clientX: number
  clientY: number
  id: number
}

export interface SmoothControlsOptions {
  // The closest the camera can be to the target
  minimumRadius?: number
  // The farthest the camera can be from the target
  maximumRadius?: number
  // The minimum angle between model-up and the camera polar position
  minimumPolarAngle?: number
  // The maximum angle between model-up and the camera polar position
  maximumPolarAngle?: number
  // The minimum angle between model-forward and the camera azimuthal position
  minimumAzimuthalAngle?: number
  // The maximum angle between model-forward and the camera azimuthal position
  maximumAzimuthalAngle?: number
  // The minimum camera field of view in degrees
  minimumFieldOfView?: number
  // The maximum camera field of view in degrees
  maximumFieldOfView?: number
  // Controls scrolling behavior
  touchAction?: TouchAction
  // Infinite zoom
  infiniteZoom?: boolean
  // Zoom to cursor
  zoomToCursor?: boolean
}

export const DEFAULT_OPTIONS = Object.freeze<Required<SmoothControlsOptions>>({
  minimumRadius: 1,
  maximumRadius: Infinity,
  minimumPolarAngle: Math.PI / 8,
  maximumPolarAngle: Math.PI - Math.PI / 8,
  minimumAzimuthalAngle: -Infinity,
  maximumAzimuthalAngle: Infinity,
  minimumFieldOfView: 40,
  maximumFieldOfView: 60,
  touchAction: 'none',
  infiniteZoom: true,
  zoomToCursor: true
})

// Constants
const KEYBOARD_ORBIT_INCREMENT = Math.PI / 8
const ZOOM_SENSITIVITY = 0.08

// The move size on pan key event
const PAN_KEY_INCREMENT = 10

export const KeyCode = {
  PAGE_UP: 33,
  PAGE_DOWN: 34,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40
}

export type ChangeSource = 'user-interaction' | 'none' | 'automatic'

export const ChangeSource: { [index: string]: ChangeSource } = {
  USER_INTERACTION: 'user-interaction',
  NONE: 'none',
  AUTOMATIC: 'automatic'
}

/**
 * ChangEvents are dispatched whenever the camera position or orientation has
 * changed
 */
export interface ChangeEvent extends ThreeEvent {
  /**
   * determines what was the originating reason for the change event eg user or
   * none
   */
  source: ChangeSource
}

export interface PointerChangeEvent extends ThreeEvent {
  type: 'pointer-change-start' | 'pointer-change-end'
}

/**
 * SmoothControls is a Three.js helper for adding delightful pointer and
 * keyboard-based input to a staged Three.js scene. Its API is very similar to
 * OrbitControls, but it offers more opinionated (subjectively more delightful)
 * defaults, easy extensibility and subjectively better out-of-the-box keyboard
 * support.
 *
 * One important change compared to OrbitControls is that the `update` method
 * of SmoothControls must be invoked on every frame, otherwise the controls
 * will not have an effect.
 *
 * Another notable difference compared to OrbitControls is that SmoothControls
 * does not currently support panning (but probably will in a future revision).
 *
 * Like OrbitControls, SmoothControls assumes that the orientation of the camera
 * has been set in terms of position, rotation and scale, so it is important to
 * ensure that the camera's matrixWorld is in sync before using SmoothControls.
 */
export class SmoothOrbitControls extends EventEmitter {
  public orbitSensitivity = 1
  public zoomSensitivity = 1
  public panSensitivity = 1
  public inputSensitivity = 1
  public changeSource = ChangeSource.NONE

  private _interactionEnabled: boolean = false
  private _options: Required<SmoothControlsOptions>
  private _disableZoom = false
  private isUserPointing = false

  // Pan state
  public enablePan = true
  public enableTap = true
  private panProjection = new Matrix3()
  private panPerPixel = 0

  // Internal orbital position state
  private spherical = new Spherical()
  private goalSpherical = new Spherical()
  private origin = new Vector3()
  private goalOrigin = new Vector3()
  private targetDamperX = new Damper()
  private targetDamperY = new Damper()
  private targetDamperZ = new Damper()
  private thetaDamper = new Damper()
  private phiDamper = new Damper()
  private radiusDamper = new Damper()
  private logFov = Math.log(DEFAULT_OPTIONS.maximumFieldOfView)
  private goalLogFov = this.logFov
  private fovDamper = new Damper()

  // Pointer state
  private touchMode: TouchMode = null
  private pointers: Pointer[] = []
  private startPointerPosition = { clientX: 0, clientY: 0 }
  private lastSeparation = 0
  private touchDecided = false
  private zoomControlCoord: Vector2 = new Vector2()

  private _controlTarget: Object3D
  private _container: HTMLElement
  private _renderer: WebGLRenderer
  private _lastTick: number = 0
  private _basisTransform: Matrix4 = new Matrix4()
  private _basisTransformInv: Matrix4 = new Matrix4()
  private _radiusDelta: number = 0

  private originSphere: Mesh
  private cursorSphere: Mesh
  private world: World

  constructor(
    controlTarget: Object3D,
    container: HTMLElement,
    renderer: WebGLRenderer,
    scene: Scene,
    world: World
  ) {
    super()
    this._controlTarget = controlTarget
    this._container = container
    this._renderer = renderer
    this.world = world
    this._options = Object.assign(
      {},
      DEFAULT_OPTIONS
    ) as Required<SmoothControlsOptions>

    const geometry = new SphereGeometry(0.01, 32, 16)
    const material = new MeshBasicMaterial({ color: 0xffff00 })
    this.originSphere = new Mesh(geometry, material)
    this.originSphere.layers.set(ObjectLayers.OVERLAY)
    const material2 = new MeshBasicMaterial({ color: 0xff0000 })
    this.cursorSphere = new Mesh(geometry, material2)
    this.cursorSphere.layers.set(ObjectLayers.OVERLAY)
    scene.add(this.originSphere)
    scene.add(this.cursorSphere)

    this.setOrbit(0, Math.PI / 2, 1)
    this.jumpToGoal()
  }

  set basisTransform(value: Matrix4) {
    this._basisTransform.copy(value)
    this._basisTransformInv.copy(value)
    this._basisTransformInv.invert()
  }

  get basisTrasform() {
    return this._basisTransform
  }

  get interactionEnabled(): boolean {
    return this._interactionEnabled
  }

  set controlTarget(value: Object3D) {
    this._controlTarget = value
    this.moveCamera()
  }

  get originV(): Vector3 {
    return this.origin
  }

  enableInteraction() {
    if (this._interactionEnabled === false) {
      this._container.addEventListener('pointerdown', this.onPointerDown)
      this._container.addEventListener('pointercancel', this.onPointerUp)

      if (!this._disableZoom) {
        this._container.addEventListener('wheel', this.onWheel)
      }
      this._container.addEventListener('keydown', this.onKeyDown)
      // This little beauty is to work around a WebKit bug that otherwise makes
      // touch events randomly not cancelable.
      this._container.addEventListener('touchmove', () => {}, { passive: false })
      this._container.addEventListener('contextmenu', this.onContext)

      //   this.element.style.cursor = 'grab'
      this._interactionEnabled = true
    }
  }

  disableInteraction() {
    if (this._interactionEnabled === true) {
      this._container.removeEventListener('pointerdown', this.onPointerDown)
      this._container.removeEventListener('pointermove', this.onPointerMove)
      this._container.removeEventListener('pointerup', this.onPointerUp)
      this._container.removeEventListener('pointercancel', this.onPointerUp)
      this._container.removeEventListener('wheel', this.onWheel)
      this._container.removeEventListener('keydown', this.onKeyDown)
      this._container.removeEventListener('contextmenu', this.onContext)

      //   element.style.cursor = ''
      this.touchMode = null
      this._interactionEnabled = false
    }
  }

  /**
   * The options that are currently configured for the controls instance.
   */
  get options() {
    return this._options
  }

  onContext = (event: MouseEvent) => {
    if (this.enablePan) {
      event.preventDefault()
    } else {
      for (const pointer of this.pointers) {
        // Required because of a common browser bug where the context menu never
        // fires a pointercancel event.
        this.onPointerUp(
          new PointerEvent('pointercancel', {
            ...this.startPointerPosition,
            pointerId: pointer.id
          })
        )
      }
    }
  }

  set disableZoom(disable: boolean) {
    if (this._disableZoom !== disable) {
      this._disableZoom = disable
      if (disable === true) {
        this._container.removeEventListener('wheel', this.onWheel)
      } else {
        this._container.addEventListener('wheel', this.onWheel)
      }
    }
  }

  /**
   * Copy the spherical values that represent the current camera orbital
   * position relative to the configured target into a provided Spherical
   * instance. If no Spherical is provided, a new Spherical will be allocated
   * to copy the values into. The Spherical that values are copied into is
   * returned.
   */
  getCameraSpherical(target: Spherical = new Spherical()) {
    return target.copy(this.spherical)
  }

  /**
   * Configure the _options of the controls. Configured _options will be
   * merged with whatever _options have already been configured for this
   * controls instance.
   */
  applyOptions(_options: SmoothControlsOptions) {
    Object.assign(this._options, _options)
    // Re-evaluates clamping based on potentially new values for min/max
    // polar, azimuth and radius:
    this.setOrbit()
    this.setFieldOfView(Math.exp(this.goalLogFov))
  }

  /**
   * Set the absolute orbital goal of the camera. The change will be
   * applied over a number of frames depending on configured acceleration and
   * dampening _options.
   *
   * Returns true if invoking the method will result in the camera changing
   * position and/or rotation, otherwise false.
   */
  setOrbit(
    goalTheta: number = this.goalSpherical.theta,
    goalPhi: number = this.goalSpherical.phi,
    goalRadius: number = this.goalSpherical.radius
  ): boolean {
    const {
      minimumAzimuthalAngle,
      maximumAzimuthalAngle,
      minimumPolarAngle,
      maximumPolarAngle,
      minimumRadius,
      maximumRadius
    } = this._options

    const { theta, phi, radius } = this.goalSpherical

    const nextTheta = clamp(goalTheta, minimumAzimuthalAngle, maximumAzimuthalAngle)
    if (!isFinite(minimumAzimuthalAngle) && !isFinite(maximumAzimuthalAngle)) {
      this.spherical.theta =
        this.wrapAngle(this.spherical.theta - nextTheta) + nextTheta
    }

    const nextPhi = clamp(goalPhi, minimumPolarAngle, maximumPolarAngle)
    const nextRadius = clamp(goalRadius, minimumRadius, maximumRadius)

    if (nextTheta === theta && nextPhi === phi && nextRadius === radius) {
      return false
    }

    if (!isFinite(nextTheta) || !isFinite(nextPhi) || !isFinite(nextRadius)) {
      return false
    }

    this.goalSpherical.theta = nextTheta
    this.goalSpherical.phi = nextPhi
    this.goalSpherical.radius = nextRadius
    this.goalSpherical.makeSafe()

    return true
  }

  /**
   * Subset of setOrbit() above, which only sets the camera's radius.
   */
  setRadius(radius: number) {
    this.goalSpherical.radius = radius
    this.setOrbit()
  }

  /**
   * Sets the goal field of view for the camera
   */
  setFieldOfView(fov: number) {
    const { minimumFieldOfView, maximumFieldOfView } = this._options
    fov = clamp(fov, minimumFieldOfView, maximumFieldOfView)
    this.goalLogFov = Math.log(fov)
  }

  /**
   * Sets the smoothing decay time.
   */
  setDamperDecayTime(decayMilliseconds: number) {
    this.thetaDamper.setDecayTime(decayMilliseconds)
    this.phiDamper.setDecayTime(decayMilliseconds)
    this.radiusDamper.setDecayTime(decayMilliseconds)
    this.fovDamper.setDecayTime(decayMilliseconds)
    this.targetDamperX.setDecayTime(decayMilliseconds)
    this.targetDamperY.setDecayTime(decayMilliseconds)
    this.targetDamperZ.setDecayTime(decayMilliseconds)
  }

  /**
   * Sets the point in model coordinates the object should orbit/pivot around.
   */
  setTarget(x: number, y: number, z: number) {
    this.goalOrigin.set(x, y, z)
  }

  /**
   * Gets the point in model coordinates the model should orbit/pivot around.
   */
  getTarget(): Vector3 {
    return this.goalOrigin.clone()
  }

  /**
   * Adjust the orbital position of the camera relative to its current orbital
   * position. Does not let the theta goal get more than pi ahead of the current
   * theta, which ensures interpolation continues in the direction of the delta.
   * The deltaZoom parameter adjusts both the field of view and the orbit radius
   * such that they progress across their allowed ranges in sync.
   */
  adjustOrbit(deltaTheta: number, deltaPhi: number, deltaZoom: number) {
    const { theta, phi, radius } = this.goalSpherical

    const dTheta = this.spherical.theta - theta
    const dThetaLimit = Math.PI - 0.001
    const goalTheta =
      theta - clamp(deltaTheta, -dThetaLimit - dTheta, dThetaLimit - dTheta)
    const goalPhi = phi - deltaPhi

    /** Original approach to zoom amount varying which works quite bad */
    // const { minimumRadius, maximumRadius, minimumFieldOfView, maximumFieldOfView } =
    // this._options
    // const a = (deltaZoom > 0 ? maximumRadius : minimumRadius) - radius
    // const b =
    //   Math.log(deltaZoom > 0 ? maximumFieldOfView : minimumFieldOfView) -
    //   this.goalLogFov
    // const deltaRatio = deltaZoom === 0 ? 0 : a / b
    // const size = this._renderer.getSize(new Vector2())
    // const zoomPerPixel = (ZOOM_SENSITIVITY * this.zoomSensitivity) / size.y
    // const metersPerPixel = this.spherical.radius * Math.exp(this.logFov) * zoomPerPixel
    // const zoomAmount =
    //   deltaZoom *
    //   (isFinite(deltaRatio) ? deltaRatio : (maximumRadius - minimumRadius) * 2) *
    //   metersPerPixel

    /** Simpler approach to zoom amount varying */
    // half of the fov is center to top of screen
    const fov = Math.exp(this.logFov) * MathUtils.DEG2RAD
    let zoomAmount = deltaZoom * this.spherical.radius * Math.tan(fov * 0.5)
    zoomAmount =
      Math.sign(zoomAmount) *
      clamp(
        Math.abs(zoomAmount),
        0,
        (this._options.maximumRadius - this._options.minimumRadius) * 0.5
      )

    const goalRadius = radius + zoomAmount
    this.setOrbit(goalTheta, goalPhi, goalRadius)

    this._radiusDelta = radius - this.goalSpherical.radius

    if (goalRadius < this._options.minimumRadius && this._options.infiniteZoom) {
      if (this._controlTarget instanceof PerspectiveCamera) {
        const dir = new Vector3().setFromSpherical(this.spherical).normalize()
        const dollyAmount = new Vector3()
          .copy(dir)
          .multiplyScalar(zoomAmount * this.world.getRelativeOffset(0.1))

        this.setTarget(
          this.origin.x + dollyAmount.x,
          this.origin.y + dollyAmount.y,
          this.origin.z + dollyAmount.z
        )
        if (this._options.zoomToCursor) this._radiusDelta = -zoomAmount
      }
    }

    if (this._options.zoomToCursor) {
      const cameraDirection = new Vector3()
        .setFromSpherical(this.spherical)
        .normalize()
        .negate()
      const planeX = new Vector3()
        .copy(cameraDirection)
        .cross(new Vector3(0, 1, 0))
        .normalize()
      if (planeX.lengthSq() === 0) planeX.x = 1.0
      const planeY = new Vector3().crossVectors(planeX, cameraDirection)
      const dims = {
        x: this._container.offsetWidth,
        y: this._container.offsetHeight
      }
      const aspect = dims.x / dims.y
      const worldToScreen =
        this.goalSpherical.radius *
        Math.tan(Math.exp(this.logFov) * MathUtils.DEG2RAD * 0.5)
      const cursor = new Vector3()
        .copy(this.goalOrigin)
        .add(planeX.multiplyScalar(this.zoomControlCoord.x * worldToScreen * aspect))
        .add(planeY.multiplyScalar(this.zoomControlCoord.y * worldToScreen))
      const lerpRatio = this._radiusDelta / this.goalSpherical.radius
      const newTargetEnd = new Vector3().copy(this.goalOrigin).lerp(cursor, lerpRatio)
      this.cursorSphere.position.copy(
        new Vector3().copy(cursor).applyMatrix4(this._basisTransform)
      )
      this.setTarget(newTargetEnd.x, newTargetEnd.y, newTargetEnd.z)
    }
    /** We're not varying fov based on zoom level for now */
    // if (deltaZoom !== 0) {
    //   const goalLogFov = this.goalLogFov + deltaZoom
    //   this.setFieldOfView(Math.exp(goalLogFov))
    // }
  }

  private orthographicHeightToDistance(height: number) {
    if (!(this._controlTarget instanceof OrthographicCamera))
      return this.spherical.radius

    return height / (Math.tan(MathUtils.DEG2RAD * Math.exp(this.logFov) * 0.5) * 2)
  }

  private distanceToOrthogrtaphicHeight(distance: number) {
    const fov = Math.exp(this.logFov)
    const dephtS = Math.tan(MathUtils.DEG2RAD * (fov / 2)) * 2.0
    return dephtS * distance
  }
  /**
   * Move the camera instantly instead of accelerating toward the goal
   * parameters.
   */
  jumpToGoal() {
    this.update(SETTLING_TIME)
  }

  /**
   * Update controls. In most cases, this will result in the camera
   * interpolating its position and rotation until it lines up with the
   * designated goal orbital position. Returns false if the camera did not move.
   *
   * Time and delta are measured in milliseconds.
   */
  update(delta?: number, worldBox?: Box3): boolean {
    const now = performance.now()
    delta = delta !== undefined ? delta : now - this._lastTick
    this._lastTick = now

    if (this.isStationary()) {
      return false
    }
    if (worldBox) {
      this.applyOptions({
        maximumRadius: worldBox.max.distanceTo(worldBox.min) * 2
      })
    }

    const { maximumPolarAngle } = this._options

    const dTheta = this.spherical.theta - this.goalSpherical.theta
    if (
      Math.abs(dTheta) > Math.PI &&
      !isFinite(this._options.minimumAzimuthalAngle) &&
      !isFinite(this._options.maximumAzimuthalAngle)
    ) {
      this.spherical.theta -= Math.sign(dTheta) * 2 * Math.PI
    }

    this.spherical.theta = this.thetaDamper.update(
      this.spherical.theta,
      this.goalSpherical.theta,
      delta,
      Math.PI
    )

    this.spherical.phi = this.phiDamper.update(
      this.spherical.phi,
      this.goalSpherical.phi,
      delta,
      maximumPolarAngle
    )

    this.spherical.radius = this.radiusDamper.update(
      this.spherical.radius,
      this.goalSpherical.radius,
      delta,
      this._options.maximumRadius
    )

    this.logFov = this.goalLogFov
    /** We're not easing the fov for now */
    // this.fovDamper.update(
    //   this.logFov,
    //   this.goalLogFov,
    //   delta,
    //   10
    // )

    let normalization = 1
    if (worldBox) {
      normalization = worldBox.getBoundingSphere(new Sphere()).radius / 10
    }
    const x = this.targetDamperX.update(
      this.origin.x,
      this.goalOrigin.x,
      delta,
      normalization
    )
    const y = this.targetDamperY.update(
      this.origin.y,
      this.goalOrigin.y,
      delta,
      normalization
    )
    const z = this.targetDamperZ.update(
      this.origin.z,
      this.goalOrigin.z,
      delta,
      normalization
    )
    this.origin.set(x, y, z)

    this.moveCamera()

    return true
  }

  private isStationary(): boolean {
    return (
      this.goalSpherical.theta === this.spherical.theta &&
      this.goalSpherical.phi === this.spherical.phi &&
      this.goalSpherical.radius === this.spherical.radius &&
      this.goalLogFov === this.logFov &&
      this.goalOrigin.equals(this.origin)
    )
  }

  private moveCamera() {
    // Derive the new camera position from the updated spherical:
    this.spherical.makeSafe()
    if (this._controlTarget instanceof PerspectiveCamera) {
      this._controlTarget.position.setFromSpherical(this.spherical).add(this.origin)
    }
    if (this._controlTarget instanceof OrthographicCamera) {
      this._controlTarget.position.setFromSpherical(this.spherical).add(this.origin)
      const cameraDirection = new Vector3()
        .setFromSpherical(this.spherical)
        .normalize()
        .negate()
      this._controlTarget.position.add(
        cameraDirection.multiplyScalar(
          (this._options.maximumRadius -
            this.options.minimumRadius -
            this.spherical.radius) *
            -1
        )
      )
    }
    this._controlTarget.setRotationFromEuler(
      new Euler(this.spherical.phi - Math.PI / 2, this.spherical.theta, 0, 'YXZ')
    )
    this._controlTarget.applyMatrix4(this._basisTransform)
    const originSphereT = new Vector3()
      .copy(this.origin)
      .applyMatrix4(this._basisTransform)
    this.originSphere.position.copy(originSphereT)
    if (this._controlTarget instanceof PerspectiveCamera)
      if (this._controlTarget.fov !== Math.exp(this.logFov)) {
        this._controlTarget.fov = Math.exp(this.logFov)
        this._controlTarget.updateProjectionMatrix()
      }
    if (this._controlTarget instanceof OrthographicCamera) {
      const depth = this.spherical.radius
      const dims = {
        x: this._container.offsetWidth,
        y: this._container.offsetHeight
      }
      const aspect = dims.x / dims.y
      const fov = Math.exp(this.logFov)
      const dephtS = Math.tan(MathUtils.DEG2RAD * (fov / 2)) * 2.0
      const Z = depth
      const width = dephtS * Z * aspect
      const height = dephtS * Z
      this._controlTarget.zoom = 1
      this._controlTarget.left = width / -2
      this._controlTarget.right = width / 2
      this._controlTarget.top = height / 2
      this._controlTarget.bottom = height / -2
      this._controlTarget.updateProjectionMatrix()
    }

    const plm = new Vector3()
      .copy(this._controlTarget.position)
      .applyMatrix4(this._basisTransformInv)
    const offset = new Vector3().copy(plm).sub(this.origin)
    const ortho = this.distanceToOrthogrtaphicHeight(offset.length())
    const dist = this.orthographicHeightToDistance(ortho)
    dist
    // console.log(this.spherical.radius, offset.length(), ortho, dist)
  }

  private userAdjustOrbit(deltaTheta: number, deltaPhi: number, deltaZoom: number) {
    this.adjustOrbit(
      deltaTheta * this.orbitSensitivity * this.inputSensitivity,
      deltaPhi * this.orbitSensitivity * this.inputSensitivity,
      deltaZoom * this.zoomSensitivity * this.inputSensitivity
    )
  }

  // Wraps to between -pi and pi
  private wrapAngle(radians: number): number {
    const normalized = (radians + Math.PI) / (2 * Math.PI)
    const wrapped = normalized - Math.floor(normalized)
    return wrapped * 2 * Math.PI - Math.PI
  }

  private pixelLengthToSphericalAngle(pixelLength: number): number {
    const size = this._renderer.getSize(new Vector2())
    return (2 * Math.PI * pixelLength) / size.y
  }

  private twoTouchDistance(touchOne: Pointer, touchTwo: Pointer): number {
    const { clientX: xOne, clientY: yOne } = touchOne
    const { clientX: xTwo, clientY: yTwo } = touchTwo
    const xDelta = xTwo - xOne
    const yDelta = yTwo - yOne

    return Math.sqrt(xDelta * xDelta + yDelta * yDelta)
  }

  private touchModeZoom: TouchMode = (dx: number, dy: number) => {
    if (!this._disableZoom) {
      const size = this._renderer.getSize(new Vector2())
      const touchDistance = this.twoTouchDistance(this.pointers[0], this.pointers[1])
      const deltaZoom =
        (ZOOM_SENSITIVITY *
          this.zoomSensitivity *
          (this.lastSeparation - touchDistance) *
          50) /
        size.y
      this.lastSeparation = touchDistance

      this.userAdjustOrbit(0, 0, deltaZoom)
    }

    if (this.panPerPixel > 0) {
      this.movePan(dx, dy)
    }
  }

  // We implement our own version of the browser's CSS touch-action, enforced by
  // this function, because the iOS implementation of pan-y is bad and doesn't
  // match Android. Specifically, even if a touch gesture begins by panning X,
  // iOS will switch to scrolling as soon as the gesture moves in the Y, rather
  // than staying in the same mode until the end of the gesture.
  private disableScroll = (event: TouchEvent) => {
    event.preventDefault()
  }

  private touchModeRotate: TouchMode = (dx: number, dy: number) => {
    const { touchAction } = this._options
    if (!this.touchDecided && touchAction !== 'none') {
      this.touchDecided = true
      const dxMag = Math.abs(dx)
      const dyMag = Math.abs(dy)
      // If motion is mostly vertical, assume scrolling is the intent.
      if (
        this.changeSource === ChangeSource.USER_INTERACTION &&
        ((touchAction === 'pan-y' && dyMag > dxMag) ||
          (touchAction === 'pan-x' && dxMag > dyMag))
      ) {
        this.touchMode = null
        return
      } else {
        this._container.addEventListener('touchmove', this.disableScroll, {
          passive: false
        })
      }
    }
    this.handleSinglePointerMove(dx, dy)
  }

  private handleSinglePointerMove(dx: number, dy: number) {
    const deltaTheta = this.pixelLengthToSphericalAngle(dx)
    const deltaPhi = this.pixelLengthToSphericalAngle(dy)

    if (this.isUserPointing === false) {
      this.isUserPointing = true
      // TO DO
      //   this.dispatchEvent({ type: 'pointer-change-start' })
    }

    this.userAdjustOrbit(deltaTheta, deltaPhi, 0)
  }

  private initializePan() {
    const size = this._renderer.getSize(new Vector2())
    const { theta, phi } = this.spherical
    const psi = theta //- this.scene.yaw
    this.panPerPixel = (PAN_SENSITIVITY * this.panSensitivity) / size.y
    this.panProjection.set(
      -Math.cos(psi),
      -Math.cos(phi) * Math.sin(psi),
      0,
      0,
      Math.sin(phi),
      0,
      Math.sin(psi),
      -Math.cos(phi) * Math.cos(psi),
      0
    )
  }

  private movePan(dx: number, dy: number) {
    const dxy = vector3.set(dx, dy, 0).multiplyScalar(this.inputSensitivity)
    const metersPerPixel =
      this.spherical.radius * Math.exp(this.logFov) * this.panPerPixel
    dxy.multiplyScalar(metersPerPixel)

    const target = this.getTarget()
    target.add(dxy.applyMatrix3(this.panProjection))
    this.setTarget(target.x, target.y, target.z)
  }

  public fitToSphere(sphere: Sphere) {
    /** The three.js Sphere has it's origin in a CS where Y is up (proper way) */
    const nativeOrigin = new Vector3()
      .copy(sphere.center)
      .applyMatrix4(this._basisTransformInv)
    this.setTarget(nativeOrigin.x, nativeOrigin.y, nativeOrigin.z)

    this.setRadius(sphere.radius)
  }

  // TO DO
  /*
  private recenter(pointer: PointerEvent) {
    if (
      performance.now() > this.startTime + TAP_MS ||
      Math.abs(pointer.clientX - this.startPointerPosition.clientX) > TAP_DISTANCE ||
      Math.abs(pointer.clientY - this.startPointerPosition.clientY) > TAP_DISTANCE
    ) {
      return
    }
    const { scene } = this

    const hit = scene.positionAndNormalFromPoint(
      scene.getNDC(pointer.clientX, pointer.clientY)
    )

    if (hit == null) {
      const { cameraTarget } = scene.element
      scene.element.cameraTarget = ''
      scene.element.cameraTarget = cameraTarget
      // Zoom all the way out.
      this.userAdjustOrbit(0, 0, 1)
    } else {
      scene.target.worldToLocal(hit.position)
      scene.setTarget(hit.position.x, hit.position.y, hit.position.z)
    }
  }
  */

  // TO DO
  /*
  private resetRadius() {
    const { scene } = this

    const hit = scene.positionAndNormalFromPoint(vector2.set(0, 0))
    if (hit == null) {
      return
    }

    scene.target.worldToLocal(hit.position)
    const goalTarget = scene.getTarget()
    const { theta, phi } = this.spherical

    // Set target to surface hit point, except the target is still settling,
    // so offset the goal accordingly so the transition is smooth even though
    // this will drift the target slightly away from the hit point.
    const psi = theta - scene.yaw
    const n = vector3.set(
      Math.sin(phi) * Math.sin(psi),
      Math.cos(phi),
      Math.sin(phi) * Math.cos(psi)
    )
    const dr = n.dot(hit.position.sub(goalTarget))
    goalTarget.add(n.multiplyScalar(dr))

    scene.setTarget(goalTarget.x, goalTarget.y, goalTarget.z)
    // Change the camera radius to match the change in target so that the
    // camera itself does not move, unless it hits a radius bound.
    this.setOrbit(undefined, undefined, this.goalSpherical.radius - dr)
  }
  */

  private onPointerDown = (event: PointerEvent) => {
    if (this.pointers.length > 2) {
      return
    }

    if (this.pointers.length === 0) {
      this._container.addEventListener('pointermove', this.onPointerMove)
      this._container.addEventListener('pointerup', this.onPointerUp)
      this.touchMode = null
      this.touchDecided = false
      this.startPointerPosition.clientX = event.clientX
      this.startPointerPosition.clientY = event.clientY
    }

    // try {
    //   this._container.setPointerCapture(event.pointerId)
    // } catch (e) {
    //   e
    // }
    this.pointers.push({
      clientX: event.clientX,
      clientY: event.clientY,
      id: event.pointerId
    })

    this.isUserPointing = false

    if (event.pointerType === 'touch') {
      this.changeSource = event.altKey // set by interact() in controls.ts
        ? ChangeSource.AUTOMATIC
        : ChangeSource.USER_INTERACTION
      this.onTouchChange(event)
    } else {
      this.changeSource = ChangeSource.USER_INTERACTION
      this.onMouseDown(event)
    }

    if (this.changeSource === ChangeSource.USER_INTERACTION) {
      // TO DO
      //   this.dispatchEvent({ type: 'user-interaction' })
    }
  }

  private onPointerMove = (event: PointerEvent) => {
    const pointer = this.pointers.find((pointer) => pointer.id === event.pointerId)
    if (!pointer) {
      return
    }

    // In case no one gave us a pointerup or pointercancel event.
    if (event.pointerType === 'mouse' && event.buttons === 0) {
      this.onPointerUp(event)
      return
    }

    const numTouches = this.pointers.length
    const dx = (event.clientX - pointer.clientX) / numTouches
    const dy = (event.clientY - pointer.clientY) / numTouches
    if (dx === 0 && dy === 0) {
      return
    }
    pointer.clientX = event.clientX
    pointer.clientY = event.clientY

    if (event.pointerType === 'touch') {
      this.changeSource = event.altKey // set by interact() in controls.ts
        ? ChangeSource.AUTOMATIC
        : ChangeSource.USER_INTERACTION
      if (this.touchMode !== null) {
        this.touchMode(dx, dy)
      }
    } else {
      this.changeSource = ChangeSource.USER_INTERACTION
      if (this.panPerPixel > 0) {
        this.movePan(dx, dy)
      } else {
        this.handleSinglePointerMove(dx, dy)
      }
    }
  }

  private onPointerUp = (event: PointerEvent) => {
    const index = this.pointers.findIndex((pointer) => pointer.id === event.pointerId)
    if (index !== -1) {
      this.pointers.splice(index, 1)
    }

    // altKey indicates an interaction prompt; don't reset radius in this case
    // as it will cause the camera to drift.
    // if (this.panPerPixel > 0 && !event.altKey) {
    //   this.resetRadius()
    // }
    if (this.pointers.length === 0) {
      this._container.removeEventListener('pointermove', this.onPointerMove)
      this._container.removeEventListener('pointerup', this.onPointerUp)
      this._container.removeEventListener('touchmove', this.disableScroll)
      //   if (this.enablePan && this.enableTap) {
      //     this.recenter(event)
      //   }
    } else if (this.touchMode !== null) {
      this.onTouchChange(event)
    }

    // ;(this.scene.element as any)[$panElement].style.opacity = 0
    // element.style.cursor = 'grab'
    this.panPerPixel = 0

    if (this.isUserPointing) {
      // TO DO
      //   this.dispatchEvent({ type: 'pointer-change-end' })
    }
  }

  private onTouchChange(event: PointerEvent) {
    if (this.pointers.length === 1) {
      this.touchMode = this.touchModeRotate
    } else {
      if (this._disableZoom) {
        this.touchMode = null
        this._container.removeEventListener('touchmove', this.disableScroll)
        return
      }
      this.touchMode =
        this.touchDecided && this.touchMode === null ? null : this.touchModeZoom
      this.touchDecided = true
      this._container.addEventListener('touchmove', this.disableScroll, {
        passive: false
      })
      this.lastSeparation = this.twoTouchDistance(this.pointers[0], this.pointers[1])

      if (this.enablePan && this.touchMode !== null) {
        this.initializePan()
        if (!event.altKey) {
          // user interaction, not prompt
          //   ;(this.scene.element as any)[$panElement].style.opacity = 1
        }
      }
    }
  }

  private onMouseDown(event: MouseEvent) {
    this.panPerPixel = 0
    if (
      this.enablePan &&
      (event.button === 2 || event.ctrlKey || event.metaKey || event.shiftKey)
    ) {
      this.initializePan()
      //   ;(this.scene.element as any)[$panElement].style.opacity = 1
    }
    // this.element.style.cursor = 'grabbing'
  }

  private onWheel = (event: WheelEvent) => {
    this.changeSource = ChangeSource.USER_INTERACTION
    const x =
      ((event.clientX - this._container.clientLeft) / this._container.clientWidth) * 2 -
      1

    const y =
      ((event.clientY - this._container.clientTop) / this._container.clientHeight) *
        -2 +
      1
    this.zoomControlCoord.set(x, y)

    const deltaZoom =
      ((event as WheelEvent).deltaY *
        ((event as WheelEvent).deltaMode === 1 ? 18 : 1) *
        ZOOM_SENSITIVITY *
        this.zoomSensitivity) /
      30
    this.userAdjustOrbit(0, 0, deltaZoom)
    event.preventDefault()
    // TO DO
    // this.dispatchEvent({ type: 'user-interaction' })
  }

  private onKeyDown = (event: KeyboardEvent) => {
    // We track if the key is actually one we respond to, so as not to
    // accidentally clobber unrelated key inputs when the <model-viewer> has
    // focus.
    const { changeSource } = this
    this.changeSource = ChangeSource.USER_INTERACTION

    const relevantKey =
      event.shiftKey && this.enablePan
        ? this.panKeyCodeHandler(event)
        : this.orbitZoomKeyCodeHandler(event)

    if (relevantKey) {
      event.preventDefault()
      // TO DO
      //   this.dispatchEvent({ type: 'user-interaction' })
    } else {
      this.changeSource = changeSource
    }
  }

  /**
   * Handles the orbit and Zoom key presses
   * Uses constants for the increment.
   * @param event The keyboard event for the .key value
   * @returns boolean to indicate if the key event has been handled
   */
  private orbitZoomKeyCodeHandler(event: KeyboardEvent) {
    let relevantKey = true
    switch (event.key) {
      case 'PageUp':
        this.userAdjustOrbit(0, 0, ZOOM_SENSITIVITY * this.zoomSensitivity)
        break
      case 'PageDown':
        this.userAdjustOrbit(0, 0, -1 * ZOOM_SENSITIVITY * this.zoomSensitivity)
        break
      case 'ArrowUp':
        this.userAdjustOrbit(0, -KEYBOARD_ORBIT_INCREMENT, 0)
        break
      case 'ArrowDown':
        this.userAdjustOrbit(0, KEYBOARD_ORBIT_INCREMENT, 0)
        break
      case 'ArrowLeft':
        this.userAdjustOrbit(-KEYBOARD_ORBIT_INCREMENT, 0, 0)
        break
      case 'ArrowRight':
        this.userAdjustOrbit(KEYBOARD_ORBIT_INCREMENT, 0, 0)
        break
      default:
        relevantKey = false
        break
    }
    return relevantKey
  }

  /**
   * Handles the Pan key presses
   * Uses constants for the increment.
   * @param event The keyboard event for the .key value
   * @returns boolean to indicate if the key event has been handled
   */
  private panKeyCodeHandler(event: KeyboardEvent) {
    this.initializePan()
    let relevantKey = true
    switch (event.key) {
      case 'ArrowUp':
        this.movePan(0, -1 * PAN_KEY_INCREMENT) // This is the negative one so that the
        // model appears to move as the arrow
        // direction rather than the view moving
        break
      case 'ArrowDown':
        this.movePan(0, PAN_KEY_INCREMENT)
        break
      case 'ArrowLeft':
        this.movePan(-1 * PAN_KEY_INCREMENT, 0)
        break
      case 'ArrowRight':
        this.movePan(PAN_KEY_INCREMENT, 0)
        break
      default:
        relevantKey = false
        break
    }
    return relevantKey
  }
}
