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
  Matrix3,
  Spherical,
  Vector2,
  Vector3,
  PerspectiveCamera,
  Sphere,
  Matrix4,
  MathUtils,
  OrthographicCamera,
  Quaternion,
  Euler,
  Mesh,
  SphereGeometry
} from 'three'

import { Damper, SETTLING_TIME } from '../../utils/Damper.js'

import { World } from '../../World.js'
import { SpeckleControls } from './SpeckleControls.js'
import { lerp } from 'three/src/math/MathUtils.js'
import { computeOrthographicSize } from '../CameraController.js'
import { ObjectLayers } from '../../../IViewer.js'
import SpeckleBasicMaterial from '../../materials/SpeckleBasicMaterial.js'
import SpeckleRenderer from '../../SpeckleRenderer.js'

/**
 * @param {Number} value
 * @param {Number} lowerLimit
 * @param {Number} upperLimit
 * @return {Number} value clamped within lowerLimit..upperLimit
 */
const clamp = (value: number, lowerLimit: number, upperLimit: number): number =>
  Math.max(lowerLimit, Math.min(upperLimit, value))

const PAN_SENSITIVITY = 0.018
const MOVEMENT_EPSILON = 1e-5
const vector3 = new Vector3()

export type TouchMode = null | ((dx: number, dy: number) => void)
export type TouchAction = 'pan-y' | 'pan-x' | 'none'

export interface Pointer {
  clientX: number
  clientY: number
  id: number
}

export interface SmoothOrbitControlsOptions {
  // Sensitivity of rotating.
  enableOrbit?: boolean
  // Sensitivity of zooming.
  enableZoom?: boolean
  // Sensitivity of panning.
  enablePan?: boolean
  // Sensitivity of rotating.
  orbitSensitivity?: number
  // Sensitivity of zooming.
  zoomSensitivity?: number
  // Sensitivity of panning.
  panSensitivity?: number
  // General Sensitivity.
  inputSensitivity?: number
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
  // Orbit around cursor
  orbitAroundCursor?: boolean
  // Show orbit point
  showOrbitPoint?: boolean
  // Dampening
  damperDecay?: number
}

const ZOOM_SENSITIVITY = 0.08

export enum PointerChangeEvent {
  PointerChangeStart = 'pointer-change-start',
  PointerChangeEnd = 'pointer-change-end'
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
export class SmoothOrbitControls extends SpeckleControls {
  protected _enabled: boolean = false
  protected _options: Required<SmoothOrbitControlsOptions>
  protected isUserPointing = false

  // Pan state
  public enablePan = true
  public enableTap = true
  protected panProjection = new Matrix3()
  protected panPerPixel = 0

  // Internal orbital position state
  public spherical = new Spherical()
  protected goalSpherical = new Spherical()
  protected origin = new Vector3()
  protected pivotalOrigin: Vector3 = new Vector3()
  protected goalOrigin = new Vector3()
  protected targetDamperX = new Damper()
  protected targetDamperY = new Damper()
  protected targetDamperZ = new Damper()
  protected thetaDamper = new Damper()
  protected phiDamper = new Damper()
  protected radiusDamper = new Damper()
  protected logFov = Math.log(55)
  protected goalLogFov = this.logFov
  protected fovDamper = new Damper()

  // Pointer state
  protected touchMode: TouchMode = null
  protected pointers: Pointer[] = []
  protected startPointerPosition = { clientX: 0, clientY: 0 }
  protected lastSeparation = 0
  protected touchDecided = false
  protected zoomControlCoord: Vector2 = new Vector2()

  protected _targetCamera: PerspectiveCamera | OrthographicCamera
  protected _container: HTMLElement
  protected _lastTick: number = 0
  protected _basisTransform: Matrix4 = new Matrix4()
  protected _basisTransformInv: Matrix4 = new Matrix4()
  protected _radiusDelta: number = 0

  protected world: World
  protected renderer: SpeckleRenderer

  protected orbitSphere: Mesh
  protected pivotPoint: Vector3 = new Vector3()
  protected lastPivotPoint: Vector3 = new Vector3()
  protected usePivotal = false

  public get enabled(): boolean {
    return this._enabled
  }
  public set enabled(value: boolean) {
    if (value) {
      this.enableInteraction()
    } else this.disableInteraction()
    this._enabled = value
  }

  public get up() {
    return this._up
  }

  public set up(value: Vector3) {
    this._up.copy(value)
    this._basisTransform.makeRotationFromQuaternion(
      new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), this._up)
    )
    this._basisTransformInv.copy(this._basisTransform)
    this._basisTransformInv.invert()
  }

  constructor(
    camera: PerspectiveCamera | OrthographicCamera,
    container: HTMLElement,
    world: World,
    renderer: SpeckleRenderer,
    options: Required<SmoothOrbitControlsOptions>
  ) {
    super()
    this._targetCamera = camera
    this._container = container
    this.world = world
    this.renderer = renderer
    this._options = Object.assign({}, options)
    this.setDamperDecayTime(this._options.damperDecay)

    const billboardMaterial = new SpeckleBasicMaterial({ color: 0x43af11 }, [
      'BILLBOARD_FIXED'
    ])
    billboardMaterial.opacity = 0.75
    billboardMaterial.transparent = true
    billboardMaterial.color.convertSRGBToLinear()
    billboardMaterial.toneMapped = false
    billboardMaterial.depthTest = false
    billboardMaterial.billboardPixelHeight = 15 * window.devicePixelRatio

    this.orbitSphere = new Mesh(new SphereGeometry(0.5, 32, 16), billboardMaterial)
    this.orbitSphere.layers.set(ObjectLayers.OVERLAY)
    this.orbitSphere.visible = false
    this.renderer.scene.add(this.orbitSphere)
  }

  /**
   * The options that are currently configured for the controls instance.
   */
  get options(): Required<SmoothOrbitControlsOptions> {
    return this._options
  }

  set options(value: SmoothOrbitControlsOptions) {
    this.applyOptions(value)
  }

  set targetCamera(value: PerspectiveCamera | OrthographicCamera) {
    this._targetCamera = value
    this.usePivotal = this._options.orbitAroundCursor

    /** We move the lat pivot point somwhere outside of world bounds, in order to force a pivotal origin recompute */
    this.lastPivotPoint.set(
      this.world.worldOrigin.x + this.world.worldSize.x,
      this.world.worldOrigin.y + this.world.worldSize.y,
      this.world.worldOrigin.z + this.world.worldSize.z
    )
    this.moveCamera()
  }

  /** The input position and target will be in a basis with (0,1,0) as up */
  public fromPositionAndTarget(position: Vector3, target: Vector3): void {
    /** This check is targeted exclusevely towards the frontend which calls this method pointlessly each frame
     *  We don't want to make pointless calculations more than we already are
     */
    const targetPosition = this.getPosition()
    const targetTarget = this.getTarget()
    if (position.equals(targetPosition) && target.equals(targetTarget)) return

    const v0 = new Vector3().copy(position)
    const v1 = new Vector3().copy(target)
    /** Three.js Spherical assumes (0, 1, 0) as up... */
    v0.sub(v1).applyMatrix4(this._basisTransformInv)
    const spherical = new Spherical()
    spherical.setFromCartesianCoords(v0.x, v0.y, v0.z)
    this.setOrbit(spherical.theta, spherical.phi, spherical.radius)
    /** Three.js Spherical assumes (0, 1, 0) as up... */
    v1.applyMatrix4(this._basisTransformInv)
    this.setTarget(v1.x, v1.y, v1.z)
    this.usePivotal = false
  }

  /**
   * Move the camera instantly instead of accelerating toward the goal
   * parameters.
   */
  public jumpToGoal() {
    this.update(SETTLING_TIME)
  }

  public fitToSphere(sphere: Sphere) {
    /** The three.js Sphere has it's origin in a CS where Y is up (proper way) */
    const nativeOrigin = new Vector3()
      .copy(sphere.center)
      .applyMatrix4(this._basisTransformInv)
    this.setTarget(nativeOrigin.x, nativeOrigin.y, nativeOrigin.z)

    this.setRadius(sphere.radius)
    this.usePivotal = false
  }

  /**
   * Gets the current goal position
   */
  public getPosition(): Vector3 {
    return this.positionFromSpherical(this.goalSpherical, this.goalOrigin).applyMatrix4(
      this._basisTransform
    )
  }

  /**
   * Gets the point in model coordinates the model should orbit/pivot around.
   */
  public getTarget(): Vector3 {
    return this.goalOrigin.clone().applyMatrix4(this._basisTransform)
  }

  public isStationary(): boolean {
    return (
      this.goalSpherical.theta === this.spherical.theta &&
      this.goalSpherical.phi === this.spherical.phi &&
      this.goalSpherical.radius === this.spherical.radius &&
      this.goalLogFov === this.logFov &&
      this.goalOrigin.equals(this.origin) &&
      this.pivotPoint.equals(this.lastPivotPoint)
    )
  }

  /**
   * Configure the _options of the controls. Configured _options will be
   * merged with whatever _options have already been configured for this
   * controls instance.
   */
  protected applyOptions(_options: SmoothOrbitControlsOptions) {
    Object.assign(this._options, _options)
    this.setDamperDecayTime(this._options.damperDecay)
    // Re-evaluates clamping based on potentially new values for min/max
    // polar, azimuth and radius:
    this.setOrbit()
    this.setFieldOfView(Math.exp(this.goalLogFov))
  }

  /** Computes min/max radius values based on the current world size */
  protected computeMinMaxRadius() {
    if (this.world) {
      const maxDistance = this.world.getRelativeOffset(10)
      const minDistance = this.world.getRelativeOffset(0.01)
      if (!isNaN(maxDistance) && !isNaN(minDistance))
        Object.assign(this._options, {
          maximumRadius: maxDistance,
          minimumRadius: minDistance
        })
    }
  }

  /**
   * Set the absolute orbital goal of the camera. The change will be
   * applied over a number of frames depending on configured acceleration and
   * dampening _options.
   *
   * Returns true if invoking the method will result in the camera changing
   * position and/or rotation, otherwise false.
   */
  public setOrbit(
    goalTheta: number = this.goalSpherical.theta,
    goalPhi: number = this.goalSpherical.phi,
    goalRadius: number = this.goalSpherical.radius
  ): boolean {
    this.computeMinMaxRadius()
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
  public setRadius(radius: number) {
    this.goalSpherical.radius = radius
    this.setOrbit()
  }

  /**
   * Sets the goal field of view for the camera
   */
  public setFieldOfView(fov: number) {
    const { minimumFieldOfView, maximumFieldOfView } = this._options
    fov = clamp(fov, minimumFieldOfView, maximumFieldOfView)
    this.goalLogFov = Math.log(fov)
  }

  /**
   * Sets the smoothing decay time.
   */
  public setDamperDecayTime(decayMilliseconds: number) {
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
  public setTarget(x: number, y: number, z: number) {
    this.goalOrigin.set(x, y, z)
  }

  /**
   * Adjust the orbital position of the camera relative to its current orbital
   * position. Does not let the theta goal get more than pi ahead of the current
   * theta, which ensures interpolation continues in the direction of the delta.
   * The deltaZoom parameter adjusts both the field of view and the orbit radius
   * such that they progress across their allowed ranges in sync.
   */
  adjustOrbit(deltaTheta: number, deltaPhi: number, deltaZoom: number) {
    this._radiusDelta
    const { theta, phi, radius } = this.goalSpherical

    const dTheta = this.spherical.theta - theta
    const dThetaLimit = Math.PI - 0.001
    const goalTheta =
      theta - clamp(deltaTheta, -dThetaLimit - dTheta, dThetaLimit - dTheta)
    const goalPhi = phi - deltaPhi

    this.setOrbit(goalTheta, goalPhi)

    if (deltaZoom === 0) return

    const tasIntersect = true
    // Currently disabling this
    // this.intersections.intersect(
    //   this.scene,
    //   this._targetCamera as PerspectiveCamera,
    //   this.zoomControlCoord,
    //   ObjectLayers.STREAM_CONTENT_MESH,
    //   false,
    //   this.world.worldBox,
    //   true,
    //   false
    // ) !== null

    /** Simpler approach to zoom amount varying */
    const normalizedRadius =
      this.spherical.radius / this.world.worldBox.getSize(new Vector3()).length()

    let worldSizeOffset = lerp(
      this.world.getRelativeOffset(0.16) * Math.abs(deltaZoom),
      this.world.getRelativeOffset(0.64) * Math.abs(deltaZoom),
      normalizedRadius >= 0.5 ? Math.exp(normalizedRadius) : normalizedRadius
    )
    worldSizeOffset = clamp(
      worldSizeOffset,
      this.world.getRelativeOffset(0.01),
      this.world.getRelativeOffset(0.2)
    )
    const zoomAmount = worldSizeOffset * Math.sign(deltaZoom) //deltaZoom * this.spherical.radius * Math.tan(fov * 0.5)

    const goalRadius = radius + zoomAmount
    this.setOrbit(goalTheta, goalPhi, goalRadius)

    this._radiusDelta = radius - this.goalSpherical.radius

    if (this._options.zoomToCursor) {
      const dollyAmount = new Vector3()
      if (goalRadius < this._options.minimumRadius && this._options.infiniteZoom) {
        if (this._targetCamera instanceof PerspectiveCamera) {
          const dir = new Vector3().setFromSpherical(this.spherical).normalize()
          dollyAmount.copy(dir).multiplyScalar(zoomAmount)
          this._radiusDelta = -zoomAmount
        }
      }
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
        clamp(this.goalSpherical.radius, Math.abs(zoomAmount), Number.MAX_VALUE) *
        Math.tan(Math.exp(this.logFov) * MathUtils.DEG2RAD * 0.5)
      const cursor = new Vector3()
        .copy(this.goalOrigin)
        .add(
          planeX.multiplyScalar(
            this.zoomControlCoord.x * worldToScreen * aspect * +tasIntersect
          )
        )
        .add(
          planeY.multiplyScalar(this.zoomControlCoord.y * worldToScreen * +tasIntersect)
        )
        .add(dollyAmount)
      const lerpRatio = clamp(this._radiusDelta / this.goalSpherical.radius, -1, 1)
      const newTargetEnd = new Vector3().copy(this.goalOrigin).lerp(cursor, lerpRatio)

      this.setTarget(newTargetEnd.x, newTargetEnd.y, newTargetEnd.z)
    }
    /** We're not varying fov based on zoom level for now */
    // if (deltaZoom !== 0) {
    //   const goalLogFov = this.goalLogFov + deltaZoom
    //   this.setFieldOfView(Math.exp(goalLogFov))
    // }
  }

  /**
   * Update controls. In most cases, this will result in the camera
   * interpolating its position and rotation until it lines up with the
   * designated goal orbital position. Returns false if the camera did not move.
   *
   * Time and delta are measured in milliseconds.
   */
  public update(delta?: number): boolean {
    const now = performance.now()
    delta = delta !== undefined ? delta : now - this._lastTick
    this._lastTick = now

    if (this.isStationary()) {
      return false
    }

    this.computeMinMaxRadius()

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

    const minMaxRange = this._options.maximumRadius - this._options.minimumRadius
    const radiusNormalisationRange = minMaxRange < 1 ? minMaxRange : 1
    this.spherical.radius = this.radiusDamper.update(
      this.spherical.radius,
      this.goalSpherical.radius,
      delta,
      radiusNormalisationRange
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
    if (this.world) {
      normalization = this.world.worldBox.getBoundingSphere(new Sphere()).radius / 10
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

    return this.moveCamera()
  }

  /** Function expects the position argument to be in a CS where Y is up */
  protected polarFromPivotal(position: Vector3) {
    const quaternion = this.quaternionFromSpherical(this.spherical)
    /** Forward direction */
    const dir = new Vector3().setFromMatrixColumn(
      new Matrix4().makeRotationFromQuaternion(quaternion),
      2
    )
    const camPos = new Vector3().copy(position)

    /** Pivot needs to be transformed in a Y up CS  */
    const pivotPoint = new Vector3()
      .copy(this.pivotPoint)
      .applyMatrix4(this._basisTransformInv)

    const cameraPivotDist = camPos.distanceTo(pivotPoint)
    const cameraPivotDir = new Vector3().copy(camPos).sub(pivotPoint)
    cameraPivotDir.normalize()

    const dot = Math.min(Math.max(dir.dot(cameraPivotDir), -1), 1)
    const angle = Math.acos(dot)
    /** We compute a new distanced based on the pivot point */
    const polarRadius = cameraPivotDist * Math.cos(angle)
    /** We compute a new origin based on the pivot point, but keeping it along the camera's current forward direction */
    const polarOrigin = camPos.sub(new Vector3().copy(dir).multiplyScalar(polarRadius))

    this.goalOrigin.copy(polarOrigin)
    this.origin.copy(polarOrigin)

    /** For orthographica camera's we don't need to update the radius because it will break their orthographic size */
    if (this._targetCamera instanceof PerspectiveCamera) {
      this.goalSpherical.radius = polarRadius
      this.spherical.radius = polarRadius
    }
  }

  /** Function expects the origin argument to be in a CS where Y is up */
  protected positionFromPivotal(origin: Vector3, quaternion: Quaternion) {
    const pivotPoint = new Vector3()
      .copy(this.pivotPoint)
      .applyMatrix4(this._basisTransformInv)

    const position = new Vector3()
    position.copy(origin)

    position.sub(pivotPoint)
    position.applyQuaternion(quaternion)
    position.add(pivotPoint)

    return position
  }

  /** Function expects the pivotPoint and position arguments to be in a CS where Y is up */
  protected getPivotalOrigin(
    pivotPoint: Vector3,
    position: Vector3,
    quaternion: Quaternion
  ) {
    const pivotalOrigin = new Vector3().copy(position)

    pivotalOrigin.sub(pivotPoint)
    pivotalOrigin.applyQuaternion(new Quaternion().copy(quaternion).invert())
    pivotalOrigin.add(pivotPoint)

    return pivotalOrigin
  }

  protected moveCamera(): boolean {
    const lastCameraPos = new Vector3().copy(this._targetCamera.position)
    const lastCameraQuat = new Quaternion().copy(this._targetCamera.quaternion)

    this.spherical.makeSafe()

    /** We get the current position and rotation based off the latest polar params
     *  The ground truth is going to always be the polar CS!
     */
    const quaternion = this.quaternionFromSpherical(this.spherical)
    let position = this.positionFromSpherical(this.spherical, this.origin)

    if (this.usePivotal) {
      /** We transform both current and previous pivots in a CS where Y us up */
      const pivotPoint = new Vector3()
        .copy(this.pivotPoint)
        .applyMatrix4(this._basisTransformInv)
      const prevPivotPoint = new Vector3()
        .copy(this.lastPivotPoint)
        .applyMatrix4(this._basisTransformInv)

      const deltaPivot = prevPivotPoint.sub(pivotPoint)

      /** We recompute the pivotal origin/pivotal offset, but only when required! */
      if (deltaPivot.length() > 0) {
        this.pivotalOrigin.copy(this.getPivotalOrigin(pivotPoint, position, quaternion))
      }

      /** We get a new position in the pivotal CS */
      position = this.positionFromPivotal(this.pivotalOrigin, quaternion)
      /** We update the polar CS based off the new pivotal camera position,
       *  essentially creating a virtual pair polar CS which can reproduce the pivotal position */
      this.polarFromPivotal(position)
      /** Update the last pivot */
      this.lastPivotPoint.copy(this.pivotPoint)
    }

    /** We transform both position and quaternion in the required basis */
    position.applyQuaternion(
      new Quaternion().setFromRotationMatrix(this._basisTransform)
    )
    quaternion.premultiply(new Quaternion().setFromRotationMatrix(this._basisTransform))

    /** This is a trick we do for ortographic projection which stops the near plane from clipping into geometry
     *  In orthographic projection the camera's 'depth' along it's forward does not matter. Zoooming is achieved by
     *  varying the orthographic size, not by moving the camera.
     */
    if (this._targetCamera instanceof OrthographicCamera) {
      const cameraDirection = new Vector3()
        .setFromSpherical(this.spherical)
        .applyQuaternion(new Quaternion().setFromRotationMatrix(this._basisTransform))
        .normalize()
      position.add(
        cameraDirection.multiplyScalar(
          this._options.maximumRadius -
            this.options.minimumRadius -
            this.spherical.radius
        )
      )
    }
    /** Apply values and update transform */
    this._targetCamera.position.copy(position)
    this._targetCamera.quaternion.copy(quaternion)
    this._targetCamera.updateMatrixWorld(true)

    /** Fov update */
    if (this._targetCamera instanceof PerspectiveCamera)
      if (this._targetCamera.fov !== Math.exp(this.logFov)) {
        this._targetCamera.fov = Math.exp(this.logFov)
        this._targetCamera.updateProjectionMatrix()
      }

    /** Compute the correct orthographic size based on the polar radius */
    if (this._targetCamera instanceof OrthographicCamera) {
      const orthographicSize = computeOrthographicSize(
        this.spherical.radius,
        Math.exp(this.logFov),
        this._container.offsetWidth / this._container.offsetHeight
      )
      this._targetCamera.zoom = 1
      this._targetCamera.left = orthographicSize.x / -2
      this._targetCamera.right = orthographicSize.x / 2
      this._targetCamera.top = orthographicSize.y / 2
      this._targetCamera.bottom = orthographicSize.y / -2
      this._targetCamera.updateProjectionMatrix()
    }

    /** Update the debug origin sphere */
    this.orbitSphere.position.copy(
      this._options.orbitAroundCursor && this.usePivotal
        ? this.pivotPoint
        : new Vector3().copy(this.origin).applyMatrix4(this._basisTransform)
    )

    return (
      lastCameraPos.sub(this._targetCamera.position).length() > MOVEMENT_EPSILON ||
      lastCameraQuat.angleTo(this._targetCamera.quaternion) > MOVEMENT_EPSILON
    )
  }

  /*
  // Ortho height to distance function. Keeping for reference
  private orthographicHeightToDistance(height: number) {
    if (!(this._targetCamera instanceof OrthographicCamera))
      return this.spherical.radius

    return height / (Math.tan(MathUtils.DEG2RAD * Math.exp(this.logFov) * 0.5) * 2)
  }*/

  /** Three.js Spherical assumes (0, 1, 0) as up... */
  protected positionFromSpherical(spherical: Spherical, origin?: Vector3) {
    const position: Vector3 = new Vector3()
    position.setFromSpherical(spherical)
    if (origin) position.add(origin)

    return position
  }

  /** Three.js Spherical assumes (0, 1, 0) as up... */
  protected quaternionFromSpherical(spherical: Spherical) {
    const quaternion: Quaternion = new Quaternion()
    quaternion.setFromEuler(
      new Euler(spherical.phi - Math.PI / 2, spherical.theta, 0, 'YXZ')
    )

    return quaternion
  }

  protected userAdjustOrbit(deltaTheta: number, deltaPhi: number, deltaZoom: number) {
    this.adjustOrbit(
      deltaTheta *
        this._options.orbitSensitivity *
        +this._options.enableOrbit *
        this._options.inputSensitivity,
      deltaPhi *
        this._options.orbitSensitivity *
        +this._options.enableOrbit *
        this._options.inputSensitivity,
      deltaZoom *
        this._options.zoomSensitivity *
        +this._options.enableZoom *
        this._options.inputSensitivity
    )
  }

  protected enableInteraction() {
    if (this._enabled) return

    this._container.addEventListener('pointerdown', this.onPointerDown)
    this._container.addEventListener('pointercancel', this.onPointerUp)

    this._container.addEventListener('wheel', this.onWheel)
    // This little beauty is to work around a WebKit bug that otherwise makes
    // touch events randomly not cancelable.
    this._container.addEventListener('touchmove', () => {}, { passive: false })
    this._container.addEventListener('contextmenu', this.onContext)

    // this.element.style.cursor = 'grab'
  }

  protected disableInteraction() {
    if (!this._enabled) return

    this._container.removeEventListener('pointerdown', this.onPointerDown)
    this._container.removeEventListener('pointermove', this.onPointerMove)
    this._container.removeEventListener('pointerup', this.onPointerUp)
    this._container.removeEventListener('pointercancel', this.onPointerUp)
    this._container.removeEventListener('wheel', this.onWheel)
    this._container.removeEventListener('contextmenu', this.onContext)

    //   element.style.cursor = ''
    this.touchMode = null
    this.pointers.length = 0
  }

  // Wraps to between -pi and pi
  protected wrapAngle(radians: number): number {
    const normalized = (radians + Math.PI) / (2 * Math.PI)
    const wrapped = normalized - Math.floor(normalized)
    return wrapped * 2 * Math.PI - Math.PI
  }

  protected pixelLengthToSphericalAngle(pixelLength: number): number {
    return (2 * Math.PI * pixelLength) / this._container.offsetHeight
  }

  protected twoTouchDistance(touchOne: Pointer, touchTwo: Pointer): number {
    const { clientX: xOne, clientY: yOne } = touchOne
    const { clientX: xTwo, clientY: yTwo } = touchTwo
    const xDelta = xTwo - xOne
    const yDelta = yTwo - yOne

    return Math.sqrt(xDelta * xDelta + yDelta * yDelta)
  }

  protected touchModeZoom: TouchMode = (dx: number, dy: number) => {
    const touchDistance = this.twoTouchDistance(this.pointers[0], this.pointers[1])
    const deltaZoom =
      (ZOOM_SENSITIVITY *
        this._options.zoomSensitivity *
        +this._options.enableZoom *
        (this.lastSeparation - touchDistance) *
        50) /
      this._container.offsetHeight
    this.lastSeparation = touchDistance

    this.userAdjustOrbit(0, 0, deltaZoom)

    if (this.panPerPixel > 0) {
      this.movePan(dx, dy)
    }
  }

  // We implement our own version of the browser's CSS touch-action, enforced by
  // this function, because the iOS implementation of pan-y is bad and doesn't
  // match Android. Specifically, even if a touch gesture begins by panning X,
  // iOS will switch to scrolling as soon as the gesture moves in the Y, rather
  // than staying in the same mode until the end of the gesture.
  protected disableScroll = (event: TouchEvent) => {
    event.preventDefault()
  }

  protected touchModeRotate: TouchMode = (dx: number, dy: number) => {
    const { touchAction } = this._options
    if (!this.touchDecided && touchAction !== 'none') {
      this.touchDecided = true
      const dxMag = Math.abs(dx)
      const dyMag = Math.abs(dy)
      // If motion is mostly vertical, assume scrolling is the intent.
      if (
        (touchAction === 'pan-y' && dyMag > dxMag) ||
        (touchAction === 'pan-x' && dxMag > dyMag)
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

  protected handleSinglePointerMove(dx: number, dy: number) {
    const deltaTheta = this.pixelLengthToSphericalAngle(dx)
    const deltaPhi = this.pixelLengthToSphericalAngle(dy)

    if (this.isUserPointing === false) {
      this.isUserPointing = true
      this.emit(PointerChangeEvent.PointerChangeStart)
    }

    this.userAdjustOrbit(deltaTheta, deltaPhi, 0)
  }

  protected initializePan() {
    const { theta, phi } = this.spherical
    const psi = theta //- this.scene.yaw
    this.panPerPixel =
      (PAN_SENSITIVITY * this._options.panSensitivity * +this._options.enablePan) /
      this._container.offsetHeight
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

  protected movePan(dx: number, dy: number) {
    const dxy = vector3.set(dx, dy, 0).multiplyScalar(this._options.inputSensitivity)
    const metersPerPixel =
      clamp(
        this.spherical.radius,
        this.world.getRelativeOffset(0.025),
        Number.MAX_VALUE
      ) *
      Math.exp(this.logFov) *
      this.panPerPixel
    dxy.multiplyScalar(metersPerPixel)

    /** This panProjection assumes (0, 1, 0) as up... */
    const target = this.getTarget().applyMatrix4(this._basisTransformInv)
    target.add(dxy.applyMatrix3(this.panProjection))
    this.setTarget(target.x, target.y, target.z)
    this.usePivotal = false
    this.orbitSphere.visible = false
  }

  protected onPointerDown = (event: PointerEvent) => {
    if (this._options.orbitAroundCursor) {
      const x =
        ((event.clientX - this._container.offsetLeft) / this._container.offsetWidth) *
          2 -
        1

      const y =
        ((event.clientY - this._container.offsetTop) / this._container.offsetHeight) *
          -2 +
        1
      const res = this.renderer.intersections.intersect(
        this.renderer.scene,
        this._targetCamera as PerspectiveCamera,
        new Vector2(x, y),
        ObjectLayers.STREAM_CONTENT_MESH,
        true,
        this.renderer.clippingVolume
      )
      if (res && res.length) {
        this.pivotPoint.copy(res[0].point)
        this.usePivotal = true
      }
    }
    this.orbitSphere.visible = this._options.showOrbitPoint

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

    this.pointers.push({
      clientX: event.clientX,
      clientY: event.clientY,
      id: event.pointerId
    })

    this.isUserPointing = false

    if (event.pointerType === 'touch') {
      this.onTouchChange(event)
    } else {
      this.onMouseDown(event)
    }

    // TO DO
    //   this.dispatchEvent({ type: 'user-interaction' })
  }

  protected onPointerMove = (event: PointerEvent) => {
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
      if (this.touchMode !== null) {
        this.touchMode(dx, dy)
      }
    } else {
      if (this.panPerPixel > 0) {
        this.movePan(dx, dy)
      } else {
        this.handleSinglePointerMove(dx, dy)
      }
    }
  }

  protected onPointerUp = (event: PointerEvent) => {
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
      this.emit(PointerChangeEvent.PointerChangeEnd)
    }
    this.orbitSphere.visible = false
  }

  protected onTouchChange(event: PointerEvent) {
    if (this.pointers.length === 1) {
      this.touchMode = this.touchModeRotate
    } else {
      if (!this._options.enableZoom) {
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

  protected onMouseDown(event: MouseEvent) {
    this.panPerPixel = 0
    if (
      this.enablePan &&
      (event.button === 2 || event.ctrlKey || event.metaKey || event.shiftKey)
    ) {
      this.initializePan()
      this.orbitSphere.visible = false
    }
    // this.element.style.cursor = 'grabbing'
  }

  protected onWheel = (event: WheelEvent) => {
    const x =
      ((event.clientX - this._container.offsetLeft) / this._container.offsetWidth) * 2 -
      1

    const y =
      ((event.clientY - this._container.offsetTop) / this._container.offsetHeight) *
        -2 +
      1

    this.zoomControlCoord.set(x, y)

    const deltaZoom =
      (event.deltaY *
        (event.deltaMode === 1 ? 18 : 1) *
        ZOOM_SENSITIVITY *
        this._options.zoomSensitivity *
        +this._options.enableZoom) /
      60
    this.userAdjustOrbit(0, 0, deltaZoom)
    event.preventDefault()
    this.usePivotal = false
    this.orbitSphere.visible = false
    // TO DO
    // this.dispatchEvent({ type: 'user-interaction' })
  }

  protected onContext = (event: MouseEvent) => {
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

  public dispose(): void {
    throw new Error('Method not implemented.')
  }
}
