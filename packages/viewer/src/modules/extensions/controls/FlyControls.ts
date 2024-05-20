import { Euler, EventDispatcher, Matrix4, Object3D, Quaternion, Vector3 } from 'three'

const _euler = new Euler(0, 0, 0, 'YXZ')
const _vector = new Vector3()

const _changeEvent = { type: 'change' }
const _lockEvent = { type: 'lock' }
const _unlockEvent = { type: 'unlock' }

const _PI_2 = Math.PI / 2

class FlyControls extends EventDispatcher {
  protected camera: Object3D
  protected domElement: HTMLElement
  protected isLocked: boolean
  protected minPolarAngle: number
  protected maxPolarAngle: number
  protected pointerSpeed: number
  protected moveForward = false
  protected moveBackward = false
  protected moveLeft = false
  protected moveRight = false
  protected velocity = new Vector3()
  protected direction = new Vector3()

  constructor(camera: Object3D, domElement: HTMLElement) {
    super()

    this.camera = camera
    this.domElement = domElement

    this.isLocked = true

    // Set to constrain the pitch of the camera
    // Range is 0 to Math.PI radians
    this.minPolarAngle = 0 // radians
    this.maxPolarAngle = Math.PI // radians

    this.pointerSpeed = 1.0

    this.connect()
  }

  update(delta: number) {
    this.velocity.x -= this.velocity.x * 10.0 * delta
    this.velocity.z -= this.velocity.z * 10.0 * delta

    this.velocity.y -= 9.8 * 100.0 * delta // 100.0 = mass

    this.direction.z = Number(this.moveForward) - Number(this.moveBackward)
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft)
    this.direction.normalize() // this ensures consistent movements in all directions

    if (this.moveForward || this.moveBackward)
      this.velocity.z -= this.direction.z * 400.0 * delta
    if (this.moveLeft || this.moveRight)
      this.velocity.x -= this.direction.x * 400.0 * delta

    // const t = new Matrix4().makeRotationFromEuler(new Euler(Math.PI * 0.5))
    // const tInv = new Matrix4().copy(t).invert()
    // this.camera.position.applyMatrix4(tInv)
    this.moveRightF(-this.velocity.x * delta)
    this.moveForwardF(-this.velocity.z * delta)
    // this.camera.position.applyMatrix4(t)
  }

  connect() {
    this.domElement.addEventListener('pointermove', this.onMouseMove)
    this.domElement.ownerDocument.addEventListener(
      'pointerlockchange',
      this.onPointerlockChange
    )
    this.domElement.ownerDocument.addEventListener(
      'pointerlockerror',
      this.onPointerlockError
    )
    document.addEventListener('keydown', this.onKeyDown)
    document.addEventListener('keyup', this.onKeyUp)
  }

  disconnect() {
    this.domElement.removeEventListener('pointermove', this.onMouseMove)
    this.domElement.ownerDocument.removeEventListener(
      'pointerlockchange',
      this.onPointerlockChange
    )
    this.domElement.ownerDocument.removeEventListener(
      'pointerlockerror',
      this.onPointerlockError
    )
    document.removeEventListener('keydown', this.onKeyDown)
    document.removeEventListener('keyup', this.onKeyUp)
  }

  dispose() {
    this.disconnect()
  }

  getObject() {
    // retaining this method for backward compatibility

    return this.camera
  }

  getDirection(v: Vector3) {
    return v.set(0, 0, -1).applyQuaternion(this.camera.quaternion)
  }

  moveForwardF(distance: number) {
    // move forward parallel to the xz-plane
    // assumes camera.up is y-up

    const camera = this.camera

    _vector.setFromMatrixColumn(camera.matrix, 0)

    _vector.crossVectors(camera.up, _vector)

    camera.position.addScaledVector(_vector, distance)
  }

  moveRightF(distance: number) {
    const camera = this.camera

    _vector.setFromMatrixColumn(camera.matrix, 0)

    camera.position.addScaledVector(_vector, distance)
  }

  lock() {
    this.domElement.requestPointerLock()
  }

  unlock() {
    this.domElement.ownerDocument.exitPointerLock()
  }

  // event listeners

  protected onMouseMove = (event: PointerEvent) => {
    if (event.buttons !== 1) return

    const movementX = event.movementX || 0
    const movementY = event.movementY || 0

    const t = new Quaternion().setFromRotationMatrix(
      new Matrix4().makeRotationFromEuler(new Euler(Math.PI * 0.5))
    )
    const tInv = new Quaternion().copy(t).invert()

    const q = new Quaternion().copy(this.camera.quaternion).premultiply(tInv)
    _euler.setFromQuaternion(q)

    _euler.y -= movementX * 0.002 * this.pointerSpeed
    _euler.x -= movementY * 0.002 * this.pointerSpeed

    _euler.x = Math.max(
      _PI_2 - this.maxPolarAngle,
      Math.min(_PI_2 - this.minPolarAngle, _euler.x)
    )

    q.setFromEuler(_euler).premultiply(t)
    this.camera.quaternion.copy(q)

    this.dispatchEvent(_changeEvent)
  }

  protected onPointerlockChange = () => {
    if (this.domElement.ownerDocument.pointerLockElement === this.domElement) {
      this.dispatchEvent(_lockEvent)

      this.isLocked = true
    } else {
      this.dispatchEvent(_unlockEvent)

      this.isLocked = false
    }
  }

  protected onPointerlockError = () => {
    console.error('THREE.PointerLockControls: Unable to use Pointer Lock API')
  }

  protected onKeyDown = (event: KeyboardEvent) => {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.moveForward = true
        break

      case 'ArrowLeft':
      case 'KeyA':
        this.moveLeft = true
        break

      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = true
        break

      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = true
        break
    }
  }

  protected onKeyUp = (event: KeyboardEvent) => {
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.moveForward = false
        break

      case 'ArrowLeft':
      case 'KeyA':
        this.moveLeft = false
        break

      case 'ArrowDown':
      case 'KeyS':
        this.moveBackward = false
        break

      case 'ArrowRight':
      case 'KeyD':
        this.moveRight = false
        break
    }
  }
}
export { FlyControls }
