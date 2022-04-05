import * as THREE from 'three'
import CameraControls from 'camera-controls'
import { KeyboardKeyHold } from 'hold-event'

export default class CameraHandler {
  constructor(viewer) {
    this.viewer = viewer

    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight
    )
    this.camera.up.set(0, 0, 1)
    this.camera.position.set(1, 1, 1)
    this.camera.updateProjectionMatrix()

    const aspect =
      this.viewer.container.offsetWidth / this.viewer.container.offsetHeight
    const fustrumSize = 50
    this.orthoCamera = new THREE.OrthographicCamera(
      (-fustrumSize * aspect) / 2,
      (fustrumSize * aspect) / 2,
      fustrumSize / 2,
      -fustrumSize / 2,
      0.001,
      10000
    )
    this.orthoCamera.up.set(0, 0, 1)
    this.orthoCamera.position.set(100, 100, 100)
    this.orthoCamera.updateProjectionMatrix()

    CameraControls.install({ THREE })
    this.controls = new CameraControls(this.camera, this.viewer.renderer.domElement)
    this.controls.maxPolarAngle = Math.PI / 2
    this.setupWASDControls()

    this.cameras = [
      {
        camera: this.camera,
        controls: this.controls,
        name: 'perspective',
        active: true
      },
      {
        camera: this.orthoCamera,
        controls: this.controls,
        name: 'ortho',
        active: false
      }
    ]

    this.orbiting = false
    this.controls.addEventListener('transitionstart', () => {
      this.orbiting = true
    })
    // note: moved to new controls event called "rest"
    this.controls.addEventListener('controlend', () => {})
    this.controls.addEventListener('rest', () => {
      setTimeout(() => {
        this.orbiting = false
      }, 400)
    })

    window.addEventListener('resize', this.onWindowResize.bind(this), false)
    // https://github.com/specklesystems/speckle-server/issues/560
    // NOTE: To activate this, uncomment the lines below and remove the preventDefaults() from the SelectionHelper class.
    // Dim's conclusion: not worth it: makes rotations unintuitive in models with context (e.g., https://latest.speckle.dev/streams/4ed51ed832/objects/93648f9789c9a4337d6c9d15b00463b4)
    // this.viewer.container.addEventListener( 'mousedown', ( event ) => this._setOrbitPoint( event.clientX, event.clientY ) )
    // this.viewer.container.addEventListener( 'touchstart', ( event ) => this._setOrbitPoint( event.changedTouches[ 0 ].clientX, event.changedTouches[ 0 ].clientY ) )
    this.onWindowResize()
  }

  get activeCam() {
    return this.cameras[0].active ? this.cameras[0] : this.cameras[1]
  }

  set activeCam(val) {
    if (val === 'perspective') this.setPerspectiveCameraOn()
    else if (val === 'ortho') this.setOrthoCameraOn()
    else
      throw new Error(
        `'${val}' projection mode is invalid. Try with 'perspective' or 'ortho'.`
      )
  }

  set enabled(val) {
    this.controls.enabled = val
  }

  setPerspectiveCameraOn() {
    if (this.cameras[0].active) return
    this.cameras[0].active = true
    this.cameras[1].active = false

    this.setupPerspectiveCamera()
    this.viewer.needsRender = true
  }

  setOrthoCameraOn() {
    if (this.cameras[1].active) return
    this.cameras[0].active = false
    this.cameras[1].active = true

    this.setupOrthoCamera()
    this.viewer.needsRender = true
  }

  toggleCameras() {
    if (this.cameras[0].active) this.setOrthoCameraOn()
    else this.setPerspectiveCameraOn()
  }

  setupOrthoCamera() {
    this.previousDistance = this.controls.distance
    this.controls.mouseButtons.wheel = CameraControls.ACTION.ZOOM

    const lineOfSight = new THREE.Vector3()
    this.camera.getWorldDirection(lineOfSight)
    const target = new THREE.Vector3()
    this.controls.getTarget(target)
    const distance = target.clone().sub(this.camera.position)
    const depth = distance.dot(lineOfSight)
    const dims = {
      x: this.viewer.container.offsetWidth,
      y: this.viewer.container.offsetHeight
    }
    const aspect = dims.x / dims.y
    const fov = this.camera.fov
    const height = depth * 2 * Math.atan((fov * (Math.PI / 180)) / 2)
    const width = height * aspect

    this.orthoCamera.zoom = 1
    this.orthoCamera.left = width / -2
    this.orthoCamera.right = width / 2
    this.orthoCamera.top = height / 2
    this.orthoCamera.bottom = height / -2
    this.orthoCamera.far = this.camera.far
    this.orthoCamera.near = 0.0001
    this.orthoCamera.updateProjectionMatrix()
    this.orthoCamera.position.copy(this.camera.position)
    this.orthoCamera.quaternion.copy(this.camera.quaternion)

    this.controls.camera = this.orthoCamera

    // fit the camera inside, so we don't have clipping plane issues.
    // WIP implementation
    const camPos = this.orthoCamera.position
    const box = new THREE.Box3().setFromObject(
      this.viewer.sceneManager.sceneObjects.allObjects
    )
    const sphere = new THREE.Sphere()
    box.getBoundingSphere(sphere)

    let dist = sphere.distanceToPoint(camPos)
    if (dist < 0) {
      dist *= -1
      this.controls.setPosition(camPos.x + dist, camPos.y + dist, camPos.z + dist)
    }

    this.viewer.emit('projection-change', 'ortho')
  }

  setupPerspectiveCamera() {
    this.controls.mouseButtons.wheel = CameraControls.ACTION.DOLLY
    this.camera.position.copy(this.orthoCamera.position)
    this.camera.quaternion.copy(this.orthoCamera.quaternion)
    this.camera.updateProjectionMatrix()
    this.controls.distance = this.previousDistance
    this.controls.camera = this.camera
    this.controls.zoomTo(1)
    this.enableRotations()
    this.viewer.emit('projection-change', 'perspective')
  }

  disableRotations() {
    this.controls.mouseButtons.left = CameraControls.ACTION.TRUCK
  }

  enableRotations() {
    this.controls.mouseButtons.left = CameraControls.ACTION.ROTATE
  }

  setupWASDControls() {
    const KEYCODE = { W: 87, A: 65, S: 83, D: 68 }

    const wKey = new KeyboardKeyHold(KEYCODE.W, 16.666)
    const aKey = new KeyboardKeyHold(KEYCODE.A, 16.666)
    const sKey = new KeyboardKeyHold(KEYCODE.S, 16.666)
    const dKey = new KeyboardKeyHold(KEYCODE.D, 16.666)
    aKey.addEventListener(
      'holding',
      function (event) {
        if (this.viewer.mouseOverRenderer === false) return
        this.controls.truck(-0.01 * event.deltaTime, 0, false)
        return
      }.bind(this)
    )
    dKey.addEventListener(
      'holding',
      function (event) {
        if (this.viewer.mouseOverRenderer === false) return
        this.controls.truck(0.01 * event.deltaTime, 0, false)
        return
      }.bind(this)
    )
    wKey.addEventListener(
      'holding',
      function (event) {
        if (this.viewer.mouseOverRenderer === false) return
        this.controls.forward(0.01 * event.deltaTime, false)
        return
      }.bind(this)
    )
    sKey.addEventListener(
      'holding',
      function (event) {
        if (this.viewer.mouseOverRenderer === false) return
        this.controls.forward(-0.01 * event.deltaTime, false)
        return
      }.bind(this)
    )
  }

  onWindowResize() {
    this.camera.aspect =
      this.viewer.container.offsetWidth / this.viewer.container.offsetHeight
    this.camera.updateProjectionMatrix()

    const aspect =
      this.viewer.container.offsetWidth / this.viewer.container.offsetHeight
    const fustrumSize = 50
    this.orthoCamera.left = (-fustrumSize * aspect) / 2
    this.orthoCamera.right = (fustrumSize * aspect) / 2
    this.orthoCamera.top = fustrumSize / 2
    this.orthoCamera.bottom = -fustrumSize / 2
    this.orthoCamera.updateProjectionMatrix()
  }

  // https://github.com/specklesystems/speckle-server/issues/560
  _setOrbitPoint(mouseX, mouseY) {
    const elRect = this.viewer.container.getBoundingClientRect()
    const canvasX = mouseX - elRect.left
    const canvasY = mouseY - elRect.top
    const normalizedMouse = new THREE.Vector2(
      (canvasX / elRect.width) * 2.0 - 1.0,
      ((elRect.height - canvasY) / elRect.height) * 2.0 - 1.0
    )
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(normalizedMouse, this.camera)

    const intersections = raycaster.intersectObjects(
      this.viewer.sceneManager.allObjects
    )
    if (intersections.length !== 0) {
      this.controls.setOrbitPoint(
        intersections[0].point.x,
        intersections[0].point.y,
        intersections[0].point.z,
        false
      )
    }
  }
}
