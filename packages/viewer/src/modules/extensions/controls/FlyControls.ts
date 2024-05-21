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
  protected moveUp = false
  protected moveDown = false
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
    this.velocity.y -= this.velocity.y * 10.0 * delta

    this.direction.z = Number(this.moveForward) - Number(this.moveBackward)
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft)
    this.direction.y = Number(this.moveUp) - Number(this.moveDown)
    this.direction.normalize() // this ensures consistent movements in all directions

    if (this.moveForward || this.moveBackward)
      this.velocity.z -= this.direction.z * 400.0 * delta
    if (this.moveLeft || this.moveRight)
      this.velocity.x -= this.direction.x * 400.0 * delta
    if (this.moveUp || this.moveDown)
      this.velocity.y -= this.direction.y * 400.0 * delta

    this.moveRightF(-this.velocity.x * delta)
    this.moveForwardF(-this.velocity.z * delta)
    this.moveUpF(-this.velocity.y * delta)
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

  moveForwardF(distance: number) {
    // move forward parallel to the xz-plane
    // assumes camera.up is y-up

    const camera = this.camera
    const dir = camera.getWorldDirection(new Vector3())
    camera.position.addScaledVector(dir, distance)
    // _vector.setFromMatrixColumn(camera.matrix, 0)

    // _vector.crossVectors(new Vector3(0, 0, 1), _vector)

    // camera.position.addScaledVector(_vector, distance)
  }

  moveUpF(distance: number) {
    const camera = this.camera
    _vector.setFromMatrixColumn(camera.matrix, 1)

    // _vector.crossVectors(new Vector3(0, 0, 1), _vector)

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

      case 'PageUp':
      case 'KeyQ':
        this.moveDown = true
        break

      case 'PageDown':
      case 'KeyE':
        this.moveUp = true
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

      case 'PageUp':
      case 'KeyQ':
        this.moveDown = false
        break

      case 'PageDown':
      case 'KeyE':
        this.moveUp = false
        break
    }
  }
}
export { FlyControls }
