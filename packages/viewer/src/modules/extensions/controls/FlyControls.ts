import {
  Euler,
  EventDispatcher,
  Matrix4,
  Object3D,
  Quaternion,
  Vector2,
  Vector3
} from 'three'
import { Damper } from '../../utils/Damper'

const _vector = new Vector3()

const _changeEvent = { type: 'change' }

const _PI_2 = Math.PI / 2
type MoveType = 'forward' | 'back' | 'left' | 'right' | 'up' | 'down'
const walkingSpeed = 1.42 // m/s

class FlyControls extends EventDispatcher {
  protected camera: Object3D
  protected domElement: HTMLElement
  protected pointerSpeed: number
  protected velocity = new Vector3()
  protected euler = new Euler(0, 0, 0, 'YXZ')
  protected goalVelocity = new Vector3()
  protected goalEuler = new Euler(0, 0, 0, 'YXZ')
  protected direction = new Vector3()
  protected speed: number = 10
  protected keyMap: Record<MoveType, boolean> = {
    forward: false,
    back: false,
    left: false,
    right: false,
    up: false,
    down: false
  }

  protected velocityXDamper: Damper = new Damper()
  protected velocityYDamper: Damper = new Damper()
  protected velocityZDamper: Damper = new Damper()
  protected eulerXDamper: Damper = new Damper()
  protected eulerYDamper: Damper = new Damper()
  protected eulerZDamper: Damper = new Damper()
  private _lastTick: number = 0

  constructor(camera: Object3D, domElement: HTMLElement) {
    super()

    this.camera = camera
    this.domElement = domElement

    this.pointerSpeed = 1.0

    this.connect()
  }

  // public isStationary() {
  //   const naturalFrequency = 1 / Math.max(0.01, 10.0 * (1 / 60))
  //   const nilSpeed = 0.0002 * naturalFrequency
  //   if (Math.abs(this.velocity.x) < nilSpeed) console.log('done')
  // }

  update(delta?: number) {
    const now = performance.now()
    delta = delta !== undefined ? delta : now - this._lastTick
    this._lastTick = now
    const deltaSeconds = delta / 1000

    this.direction.z = Number(this.keyMap.forward) - Number(this.keyMap.back)
    this.direction.x = Number(this.keyMap.right) - Number(this.keyMap.left)
    this.direction.y = Number(this.keyMap.up) - Number(this.keyMap.down)
    this.direction.normalize() // this ensures consistent movements in all directions

    if (this.keyMap.forward)
      this.goalVelocity.z = -walkingSpeed * this.speed * deltaSeconds
    if (this.keyMap.back) this.goalVelocity.z = walkingSpeed * this.speed * deltaSeconds
    if (!this.keyMap.forward && !this.keyMap.back) this.goalVelocity.z = 0

    if (this.keyMap.left) this.goalVelocity.x = walkingSpeed * this.speed * deltaSeconds
    if (this.keyMap.right)
      this.goalVelocity.x = -walkingSpeed * this.speed * deltaSeconds
    if (!this.keyMap.left && !this.keyMap.right) this.goalVelocity.x = 0

    if (this.keyMap.up) this.goalVelocity.y = -walkingSpeed * this.speed * deltaSeconds
    if (this.keyMap.down) this.goalVelocity.y = walkingSpeed * this.speed * deltaSeconds
    if (!this.keyMap.down && !this.keyMap.up) this.goalVelocity.y = 0

    this.velocity.x = this.velocityXDamper.update(
      this.velocity.x,
      this.goalVelocity.x,
      delta,
      1
    )

    this.velocity.y = this.velocityYDamper.update(
      this.velocity.y,
      this.goalVelocity.y,
      delta,
      1
    )

    this.velocity.z = this.velocityZDamper.update(
      this.velocity.z,
      this.goalVelocity.z,
      delta,
      1
    )

    this.euler.x = this.eulerXDamper.update(this.euler.x, this.goalEuler.x, delta, 1)
    this.euler.y = this.eulerYDamper.update(this.euler.y, this.goalEuler.y, delta, 1)
    this.euler.z = this.eulerZDamper.update(this.euler.z, this.goalEuler.z, delta, 1)

    this.moveRightF(-this.velocity.x)
    this.moveForwardF(-this.velocity.z)
    this.moveUpF(-this.velocity.y)
    this.rotate(this.euler)
  }

  connect() {
    this.domElement.addEventListener('pointermove', this.onMouseMove)
    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)
  }

  disconnect() {
    this.domElement.removeEventListener('pointermove', this.onMouseMove)
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('keyup', this.onKeyUp)
  }

  dispose() {
    this.disconnect()
  }

  moveForwardF(distance: number) {
    const camera = this.camera
    const dir = camera.getWorldDirection(new Vector3())
    camera.position.addScaledVector(dir, distance)
  }

  moveUpF(distance: number) {
    const camera = this.camera
    _vector.setFromMatrixColumn(camera.matrix, 1)
    camera.position.addScaledVector(_vector, distance)
  }

  moveRightF(distance: number) {
    const camera = this.camera
    _vector.setFromMatrixColumn(camera.matrix, 0)
    camera.position.addScaledVector(_vector, distance)
  }

  rotateBy(amount: Vector2) {
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

  rotate(euler: Euler) {
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
    this.dispatchEvent(_changeEvent)
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
