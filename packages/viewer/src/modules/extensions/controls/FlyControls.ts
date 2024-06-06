import {
  Euler,
  Matrix4,
  OrthographicCamera,
  PerspectiveCamera,
  Quaternion,
  Sphere,
  Spherical,
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
  protected domElement: HTMLElement
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

  constructor(camera: PerspectiveCamera | OrthographicCamera, domElement: HTMLElement) {
    super()

    this.camera = camera
    this.domElement = domElement

    this.pointerSpeed = 1.0

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
    const cameraForward = new Vector3().setFromMatrixColumn(this.camera.matrix, 2)
    const dir = new Vector3().subVectors(target, position).normalize()
    const quaternion = new Quaternion().setFromUnitVectors(cameraForward, dir)
    this.goalEuler.setFromQuaternion(quaternion)
    this.goalPosition.copy(position)
  }

  public fromSpherical(_spherical: Spherical, _origin?: Vector3 | undefined): void {
    _spherical
    _origin
  }

  public getTarget(): Vector3 {
    throw new Error('Method not implemented.')
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

    this.domElement.addEventListener('pointermove', this.onMouseMove)
    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)
  }

  protected disconnect() {
    if (!this._enabled) return

    this.domElement.removeEventListener('pointermove', this.onMouseMove)
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('keyup', this.onKeyUp)
  }

  public dispose() {
    this.disconnect()
  }

  protected rotate(euler: Euler) {
    const q = new Quaternion()
    const t = new Quaternion().setFromRotationMatrix(
      new Matrix4().makeRotationFromEuler(new Euler(Math.PI * 0.5))
    )
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
