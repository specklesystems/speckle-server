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
import { Damper, SETTLING_TIME } from '../../utils/Damper'
import { SpeckleControls } from './SpeckleControls'

const _vectorBuff0 = new Vector3()
const _changeEvent = { type: 'change' }

const _PI_2 = Math.PI / 2
type MoveType = 'forward' | 'back' | 'left' | 'right' | 'up' | 'down'
const walkingSpeed = 1.42 // m/s

export interface FlyControlsOptions {
  lookSpeed?: number
  moveSpeed?: number
}

class FlyControls extends SpeckleControls {
  protected camera: PerspectiveCamera | OrthographicCamera
  protected container: HTMLElement
  protected pointerSpeed: number
  protected velocity = new Vector3()
  protected euler = new Euler(0, 0, 0, 'YXZ')
  protected position = new Vector3()
  protected goalEuler = new Euler(0, 0, 0, 'YXZ')
  protected goalPosition = new Vector3()
  protected speed: number = 10
  protected keyMap: Record<MoveType, boolean> = {
    forward: false,
    back: false,
    left: false,
    right: false,
    up: false,
    down: false
  }

  protected eulerXDamper: Damper = new Damper()
  protected eulerYDamper: Damper = new Damper()
  protected eulerZDamper: Damper = new Damper()
  protected positionXDamper: Damper = new Damper()
  protected positionYDamper: Damper = new Damper()
  protected positionZDamper: Damper = new Damper()
  protected _lastTick: number = 0
  protected _enabled: boolean = false
  private _basisTransform: Matrix4 = new Matrix4()
  private _basisTransformInv: Matrix4 = new Matrix4()

  public get enabled(): boolean {
    return this._enabled
  }

  public set enabled(value: boolean) {
    if (value) this.connect()
    else this.disconnect()
    this._enabled = value
  }

  public set options(_value: Record<string, unknown>) {}

  public set controlTarget(target: PerspectiveCamera | OrthographicCamera) {
    this.camera = target
    this.rotate(this.euler)
    this.camera.position.copy(this.position)
  }

  public set up(value: Vector3) {
    this._up.copy(value)
    this._basisTransform.makeRotationFromQuaternion(
      new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), this._up)
    )
    this._basisTransformInv.copy(this._basisTransform)
    this._basisTransformInv.invert()
  }

  constructor(camera: PerspectiveCamera | OrthographicCamera, container: HTMLElement) {
    super()

    this.camera = camera
    this.container = container

    this.pointerSpeed = 1.0
  }

  public isStationary(): boolean {
    return (
      this.goalEuler.equals(this.euler) &&
      this.goalPosition.equals(this.position) &&
      this.velocity.length() === 0
    )
  }

  public update(delta?: number): boolean {
    const now = performance.now()
    delta = delta !== undefined ? delta : now - this._lastTick
    this._lastTick = now
    const deltaSeconds = delta / 1000

    if (this.keyMap.forward) this.velocity.z = -walkingSpeed * this.speed * deltaSeconds
    if (this.keyMap.back) this.velocity.z = walkingSpeed * this.speed * deltaSeconds
    if (!this.keyMap.forward && !this.keyMap.back) this.velocity.z = 0

    if (this.keyMap.left) this.velocity.x = -walkingSpeed * this.speed * deltaSeconds
    if (this.keyMap.right) this.velocity.x = walkingSpeed * this.speed * deltaSeconds
    if (!this.keyMap.left && !this.keyMap.right) this.velocity.x = 0

    if (this.keyMap.up) this.velocity.y = walkingSpeed * this.speed * deltaSeconds
    if (this.keyMap.down) this.velocity.y = -walkingSpeed * this.speed * deltaSeconds
    if (!this.keyMap.down && !this.keyMap.up) this.velocity.y = 0

    if (this.isStationary()) return false

    this.moveBy(this.velocity)

    this.position.x = this.positionXDamper.update(
      this.position.x,
      this.goalPosition.x,
      delta,
      1
    )
    this.position.y = this.positionYDamper.update(
      this.position.y,
      this.goalPosition.y,
      delta,
      1
    )
    this.position.z = this.positionZDamper.update(
      this.position.z,
      this.goalPosition.z,
      delta,
      1
    )

    this.euler.x = this.eulerXDamper.update(this.euler.x, this.goalEuler.x, delta, 1)
    this.euler.y = this.eulerYDamper.update(this.euler.y, this.goalEuler.y, delta, 1)
    this.euler.z = this.eulerZDamper.update(this.euler.z, this.goalEuler.z, delta, 1)

    this.rotate(this.euler)
    this.camera.position.copy(this.position)

    return true
  }

  public jumpToGoal(): void {
    this.update(SETTLING_TIME)
  }

  public fitToSphere(sphere: Sphere): void {
    const forward = this.camera.getWorldDirection(new Vector3())
    forward.negate()
    const pos = new Vector3()
      .copy(sphere.center)
      .addScaledVector(forward, sphere.radius)
    this.goalPosition.copy(pos)
  }

  public fromPositionAndTarget(position: Vector3, target: Vector3): void {
    const tTarget = new Vector3().copy(target).applyMatrix4(this._basisTransform)
    const matrix = new Matrix4()
      .lookAt(position, tTarget, new Vector3(0, 0, 1))
      .premultiply(this._basisTransformInv)
    const quat = new Quaternion().setFromRotationMatrix(matrix)

    this.goalEuler.setFromQuaternion(quat)
    this.goalPosition.copy(position)
  }

  public getTarget(): Vector3 {
    const target = new Vector3().copy(this.goalPosition)
    const matrix = new Matrix4().makeRotationFromEuler(this.goalEuler)
    const forward = new Vector3()
      .setFromMatrixColumn(matrix, 2)
      .applyMatrix4(this._basisTransform)
      .normalize()
    target.addScaledVector(forward, -10)
    return target
  }

  public getPosition(): Vector3 {
    return this.goalPosition
  }

  public moveBy(amount: Vector3) {
    const camera = this.camera
    _vectorBuff0.setFromMatrixColumn(camera.matrix, 2)
    this.goalPosition.addScaledVector(_vectorBuff0, amount.z)
    _vectorBuff0.setFromMatrixColumn(camera.matrix, 1)
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
  }

  protected disconnect() {
    if (!this._enabled) return

    this.container.removeEventListener('pointermove', this.onMouseMove)
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('keyup', this.onKeyUp)
    for (const k in this.keyMap) this.keyMap[k as MoveType] = false
  }

  public dispose() {
    this.disconnect()
  }

  protected rotate(euler: Euler) {
    const q = new Quaternion()
    const t = new Quaternion().setFromRotationMatrix(this._basisTransform)
    q.setFromEuler(euler).premultiply(t)
    this.camera.quaternion.copy(q)
  }

  // event listeners
  protected onMouseMove = (event: PointerEvent) => {
    if (event.buttons !== 1) return

    const movementX = event.movementX || 0
    const movementY = event.movementY || 0
    const amount = new Vector2()
    amount.y = movementX * 0.005 * this.pointerSpeed
    amount.x = movementY * 0.005 * this.pointerSpeed

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
      case 'KeyQ':
        this.keyMap.down = true
        break

      case 'PageDown':
      case 'KeyE':
        this.keyMap.up = true
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
      case 'KeyQ':
        this.keyMap.down = false
        break

      case 'PageDown':
      case 'KeyE':
        this.keyMap.up = false
        break
    }
  }
}
export { FlyControls }
