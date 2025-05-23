import {
  Euler,
  Matrix4,
  OrthographicCamera,
  PerspectiveCamera,
  Quaternion,
  Sphere,
  Vector2,
  Vector3
} from 'three'
import { Damper, SETTLING_TIME } from '../../utils/Damper.js'
import { SpeckleControls } from './SpeckleControls.js'
import { World } from '../../World.js'
import { AngleDamper } from '../../utils/AngleDamper.js'
import { TIME_MS } from '@speckle/shared'

const _vectorBuff0 = new Vector3()
const _changeEvent = { type: 'change' }

const _PI_2 = Math.PI / 2
type MoveType = 'forward' | 'back' | 'left' | 'right' | 'up' | 'down'
const walkingSpeed = 1.42 // m/s
const closeRelativeFactor = 0.03
const farRelativeFactor = 0.2
const relativeMinTargetDistance = 0.01

export interface FlyControlsOptions {
  [name: string]: unknown
  enableLook?: boolean
  lookSpeed?: number
  moveSpeed?: number
  damperDecay?: number
  relativeUpDown?: boolean
}

class FlyControls extends SpeckleControls {
  protected _options: Required<FlyControlsOptions>
  protected _targetCamera: PerspectiveCamera | OrthographicCamera
  protected container: HTMLElement
  protected velocity = new Vector3()
  protected euler = new Euler(0, 0, 0, 'YXZ')
  protected position = new Vector3()
  protected goalEuler = new Euler(0, 0, 0, 'YXZ')
  protected goalPosition = new Vector3()
  protected keyMap: Record<MoveType, boolean> = {
    forward: false,
    back: false,
    left: false,
    right: false,
    up: false,
    down: false
  }
  protected contextMenuTriggered = false

  protected eulerXDamper: AngleDamper = new AngleDamper()
  protected eulerYDamper: AngleDamper = new AngleDamper()
  protected eulerZDamper: AngleDamper = new AngleDamper()
  protected positionXDamper: Damper = new Damper()
  protected positionYDamper: Damper = new Damper()
  protected positionZDamper: Damper = new Damper()
  protected _lastTick: number = 0
  protected _enabled: boolean = false
  private _basisTransform: Matrix4 = new Matrix4()
  private _basisTransformInv: Matrix4 = new Matrix4()

  protected _minDist: number

  private world: World

  public get enabled(): boolean {
    return this._enabled
  }

  public set enabled(value: boolean) {
    this._enabled = value
  }

  public get options(): FlyControlsOptions {
    return this._options
  }

  public set options(value: FlyControlsOptions) {
    Object.assign(this._options, value)
    if (value.moveSpeed) console.warn('Fly speed modifier: ', this._options.moveSpeed)
    this.setDamperDecayTime(this._options.damperDecay)
  }

  public set targetCamera(target: PerspectiveCamera | OrthographicCamera) {
    this._targetCamera = target
    this.rotate(this.euler)
    this._targetCamera.position.copy(this.position)
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

  public set minDist(value: number) {
    this._minDist = value
  }

  constructor(
    camera: PerspectiveCamera | OrthographicCamera,
    container: HTMLElement,
    world: World,
    options: Required<FlyControlsOptions>
  ) {
    super()

    this._targetCamera = camera
    this.container = container
    this.world = world
    this._options = Object.assign({}, options)

    this.connect()
  }

  public isStationary(): boolean {
    return (
      this.goalEuler.equals(this.euler) &&
      this.goalPosition.equals(this.position) &&
      this.velocity.length() === 0
    )
  }

  public update(delta?: number): boolean {
    /** We do this because sometimes while holding a kewy down you get an extra
     *  key down event **after** the context menu event, locking it in place
     */
    if (this.contextMenuTriggered) {
      this.cancelMove()
      this.contextMenuTriggered = false
    }

    const now = performance.now()
    delta = delta !== undefined ? delta : now - this._lastTick
    this._lastTick = now

    if (!this._enabled) return false

    let relativeFactor = this.world.getRelativeOffset(farRelativeFactor)
    if (this._minDist) {
      if (this._minDist < relativeFactor * 0.5)
        relativeFactor = this.world.getRelativeOffset(closeRelativeFactor)
    }

    const deltaSeconds = delta / TIME_MS.second
    const scaledWalkingSpeed = relativeFactor * walkingSpeed

    if (this.keyMap.forward)
      this.velocity.z = -scaledWalkingSpeed * this._options.moveSpeed * deltaSeconds
    if (this.keyMap.back)
      this.velocity.z = scaledWalkingSpeed * this._options.moveSpeed * deltaSeconds
    if (!this.keyMap.forward && !this.keyMap.back) this.velocity.z = 0

    if (this.keyMap.left)
      this.velocity.x = -scaledWalkingSpeed * this._options.moveSpeed * deltaSeconds
    if (this.keyMap.right)
      this.velocity.x = scaledWalkingSpeed * this._options.moveSpeed * deltaSeconds
    if (!this.keyMap.left && !this.keyMap.right) this.velocity.x = 0

    if (this.keyMap.up)
      this.velocity.y = scaledWalkingSpeed * this._options.moveSpeed * deltaSeconds
    if (this.keyMap.down)
      this.velocity.y = -scaledWalkingSpeed * this._options.moveSpeed * deltaSeconds
    if (!this.keyMap.down && !this.keyMap.up) this.velocity.y = 0

    if (this.isStationary()) return false

    this.moveBy(this.velocity)

    this.updatePositionRotation(delta)

    return true
  }

  protected updatePositionRotation(delta: number) {
    const diagonal = this.world.worldBox.min.distanceTo(this.world.worldBox.max)
    /** For very small values, the dampners need even smaller normalization */
    const minMaxRange = diagonal < 1 ? this.world.getRelativeOffset(diagonal) : 1
    this.position.x = this.positionXDamper.update(
      this.position.x,
      this.goalPosition.x,
      delta,
      minMaxRange
    )
    this.position.y = this.positionYDamper.update(
      this.position.y,
      this.goalPosition.y,
      delta,
      minMaxRange
    )
    this.position.z = this.positionZDamper.update(
      this.position.z,
      this.goalPosition.z,
      delta,
      minMaxRange
    )

    this.euler.x = this.eulerXDamper.update(this.euler.x, this.goalEuler.x, delta, 1)
    this.euler.y = this.eulerYDamper.update(this.euler.y, this.goalEuler.y, delta, 1)
    this.euler.z = this.eulerZDamper.update(this.euler.z, this.goalEuler.z, delta, 1)

    this.rotate(this.euler)
    this._targetCamera.position.copy(this.position)
  }

  public jumpToGoal(): void {
    this.updatePositionRotation(SETTLING_TIME)
  }

  public fitToSphere(sphere: Sphere): void {
    const forward = this._targetCamera.getWorldDirection(new Vector3())
    forward.negate()
    const pos = new Vector3()
      .copy(sphere.center)
      .addScaledVector(forward, sphere.radius)
    this.goalPosition.copy(pos)
  }

  /** The input position and target will be in a basis with (0,0,1) as up */
  public fromPositionAndTarget(position: Vector3, target: Vector3): void {
    const cPos = this.getPosition()
    const cTarget = this.getTarget()
    if (cPos.equals(position) && cTarget.equals(target)) return

    const tPosition = new Vector3().copy(position)
    const tTarget = new Vector3().copy(target)
    const matrix = new Matrix4()
      .lookAt(tPosition, tTarget, this._up)
      .premultiply(this._basisTransformInv)
    const quat = new Quaternion().setFromRotationMatrix(matrix)
    this.goalEuler.setFromQuaternion(quat)
    this.goalPosition.copy(tPosition)
  }

  /** The returned vector needs to be in a basis with (0,0,1) as up */
  public getTarget(): Vector3 {
    const target = new Vector3().copy(this.goalPosition)
    const matrix = new Matrix4().makeRotationFromEuler(this.goalEuler)
    const forward = new Vector3()
      .setFromMatrixColumn(matrix, 2)
      .applyMatrix4(this._basisTransform)
      .normalize()
    target.addScaledVector(
      forward,
      -this.world.getRelativeOffset(relativeMinTargetDistance)
    )
    return target
  }

  /** The returned vector needs to be in a basis with (0,0,1) as up */
  public getPosition(): Vector3 {
    return new Vector3().copy(this.goalPosition)
  }

  /**
   * Gets the current goal position
   */
  public getCurrentPosition(): Vector3 {
    return this.position
  }

  /**
   * Gets the point in model coordinates the model should orbit/pivot around.
   */
  public getCurrentTarget(): Vector3 {
    const target = new Vector3().copy(this.position)
    const matrix = new Matrix4().makeRotationFromEuler(this.euler)
    const forward = new Vector3()
      .setFromMatrixColumn(matrix, 2)
      .applyMatrix4(this._basisTransform)
      .normalize()
    target.addScaledVector(
      forward,
      -this.world.getRelativeOffset(relativeMinTargetDistance)
    )
    return target
  }

  /**
   * Sets the smoothing decay time.
   */
  public setDamperDecayTime(decayMilliseconds: number) {
    this.eulerXDamper.setDecayTime(decayMilliseconds)
    this.eulerYDamper.setDecayTime(decayMilliseconds)
    this.eulerZDamper.setDecayTime(decayMilliseconds)
    this.positionXDamper.setDecayTime(decayMilliseconds)
    this.positionYDamper.setDecayTime(decayMilliseconds)
    this.positionZDamper.setDecayTime(decayMilliseconds)
  }

  public moveBy(amount: Vector3) {
    const camera = this._targetCamera
    _vectorBuff0.setFromMatrixColumn(camera.matrix, 2)
    this.goalPosition.addScaledVector(_vectorBuff0, amount.z)
    this._options.relativeUpDown
      ? _vectorBuff0.setFromMatrixColumn(camera.matrix, 1)
      : _vectorBuff0.copy(this.up)
    this.goalPosition.addScaledVector(_vectorBuff0, amount.y)
    _vectorBuff0.setFromMatrixColumn(camera.matrix, 0)
    this.goalPosition.addScaledVector(_vectorBuff0, amount.x)
  }

  public rotateBy(amount: Vector2) {
    this.goalEuler.y -= amount.y
    this.goalEuler.x -= amount.x
    // Set to constrain the pitch of the camera
    const minPolarAngle = 0 // radians
    const maxPolarAngle = Math.PI // radians
    this.goalEuler.x = Math.max(
      _PI_2 - maxPolarAngle,
      Math.min(_PI_2 - minPolarAngle, this.goalEuler.x)
    )
  }

  protected connect() {
    if (this._enabled) return

    this.container.addEventListener('pointermove', this.onMouseMove)
    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)
    document.addEventListener('contextmenu', this.onContextMenu)
  }

  protected disconnect() {
    if (!this._enabled) return

    this.container.removeEventListener('pointermove', this.onMouseMove)
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('keyup', this.onKeyUp)
    document.removeEventListener('contextmenu', this.onContextMenu)
    for (const k in this.keyMap) this.keyMap[k as MoveType] = false
  }

  public dispose() {
    this.disconnect()
  }

  protected rotate(euler: Euler) {
    if (!this._options.enableLook) return

    const q = new Quaternion()
    const t = new Quaternion().setFromRotationMatrix(this._basisTransform)
    q.setFromEuler(euler).premultiply(t)
    this._targetCamera.quaternion.slerp(q, 0.999)
  }

  // event listeners
  protected onMouseMove = (event: PointerEvent) => {
    if (event.buttons !== 1 || !this._enabled) return

    const movementX = event.movementX || 0
    const movementY = event.movementY || 0
    const amount = new Vector2()
    amount.y = movementX * 0.005 * this._options.lookSpeed
    amount.x = movementY * 0.005 * this._options.lookSpeed

    this.rotateBy(amount)
    this.emit(_changeEvent)
  }

  protected onKeyDown = (event: KeyboardEvent) => {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.keyMap.forward = true
        break

      case 'ArrowLeft':
      case 'KeyA':
        this.keyMap.left = true
        break

      case 'ArrowDown':
      case 'KeyS':
        this.keyMap.back = true
        break

      case 'ArrowRight':
      case 'KeyD':
        this.keyMap.right = true
        break

      case 'PageUp':
      case 'KeyE':
        this.keyMap.up = true
        break

      case 'PageDown':
      case 'KeyQ':
        this.keyMap.down = true
        break
    }
  }

  protected onKeyUp = (event: KeyboardEvent) => {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.keyMap.forward = false
        break

      case 'ArrowLeft':
      case 'KeyA':
        this.keyMap.left = false
        break

      case 'ArrowDown':
      case 'KeyS':
        this.keyMap.back = false
        break

      case 'ArrowRight':
      case 'KeyD':
        this.keyMap.right = false
        break

      case 'PageUp':
      case 'KeyE':
        this.keyMap.up = false
        break

      case 'PageDown':
      case 'KeyQ':
        this.keyMap.down = false
        break
    }
  }

  protected onContextMenu = () => {
    this.contextMenuTriggered = true
  }

  protected cancelMove() {
    this.keyMap.forward = false
    this.keyMap.left = false
    this.keyMap.back = false
    this.keyMap.right = false
    this.keyMap.up = false
    this.keyMap.down = false
  }
}
export { FlyControls }
