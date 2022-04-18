import * as THREE from 'three'

import Stats from 'three/examples/jsm/libs/stats.module.js'

import ObjectManager from './SceneObjectManager'
import ViewerObjectLoader from './ViewerObjectLoader'
import EventEmitter from './EventEmitter'
import InteractionHandler from './InteractionHandler'
import CameraHandler from './context/CameraHanlder'

import SectionBox from './SectionBox'

export default class Viewer extends EventEmitter {
  constructor({
    container,
    postprocessing = false,
    reflections = true,
    showStats = false
  }) {
    super()

    window.THREE = THREE

    this.clock = new THREE.Clock()

    this.container = container || document.getElementById('renderer')
    this.postprocessing = postprocessing
    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    })
    this.renderer.setClearColor(0xcccccc, 0)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight)
    this.container.appendChild(this.renderer.domElement)

    this.cameraHandler = new CameraHandler(this)

    this.reflections = reflections
    this.reflectionsNeedUpdate = true
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
      format: THREE.RGBFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter
    })
    this.cubeCamera = new THREE.CubeCamera(0.1, 10_000, cubeRenderTarget)
    this.scene.add(this.cubeCamera)

    if (showStats) {
      this.stats = new Stats()
      this.container.appendChild(this.stats.dom)
    }

    window.addEventListener('resize', this.onWindowResize.bind(this), false)

    this.mouseOverRenderer = false
    this.renderer.domElement.addEventListener('mouseover', () => {
      this.mouseOverRenderer = true
    })
    this.renderer.domElement.addEventListener('mouseout', () => {
      this.mouseOverRenderer = false
    })

    this.loaders = {}

    this.sectionBox = new SectionBox(this)
    this.sectionBox.off()

    this.sceneManager = new ObjectManager(this)
    this.interactions = new InteractionHandler(this)

    this.sceneLights()
    this.animate()
    this.onWindowResize()
    this.interactions.zoomExtents()
    this.needsRender = true

    this.inProgressOperations = 0
  }

  sceneLights() {
    // const dirLight = new THREE.DirectionalLight( 0xffffff, 0.1 )
    // dirLight.color.setHSL( 0.1, 1, 0.95 )
    // dirLight.position.set( -1, 1.75, 1 )
    // dirLight.position.multiplyScalar( 1000 )
    // this.scene.add( dirLight )

    // const dirLight2 = new THREE.DirectionalLight( 0xffffff, 0.9 )
    // dirLight2.color.setHSL( 0.1, 1, 0.95 )
    // dirLight2.position.set( 0, -1.75, 1 )
    // dirLight2.position.multiplyScalar( 1000 )
    // this.scene.add( dirLight2 )

    // const hemiLight2 = new THREE.HemisphereLight( 0xffffff, new THREE.Color( '#232323' ), 1.9 )
    // hemiLight2.color.setHSL( 1, 1, 1 )
    // // hemiLight2.groundColor = new THREE.Color( '#232323' )
    // hemiLight2.up.set( 0, 0, 1 )
    // this.scene.add( hemiLight2 )

    // let axesHelper = new THREE.AxesHelper( 1 )
    // this.scene.add( axesHelper )

    // return

    const ambientLight = new THREE.AmbientLight(0xffffff)
    this.scene.add(ambientLight)

    const lights = []
    lights[0] = new THREE.PointLight(0xffffff, 0.21, 0)
    lights[1] = new THREE.PointLight(0xffffff, 0.21, 0)
    lights[2] = new THREE.PointLight(0xffffff, 0.21, 0)
    lights[3] = new THREE.PointLight(0xffffff, 0.21, 0)

    const factor = 1000
    lights[0].position.set(1 * factor, 1 * factor, 1 * factor)
    lights[1].position.set(1 * factor, -1 * factor, 1 * factor)
    lights[2].position.set(-1 * factor, -1 * factor, 1 * factor)
    lights[3].position.set(-1 * factor, 1 * factor, 1 * factor)

    this.scene.add(lights[0])
    this.scene.add(lights[1])
    this.scene.add(lights[2])
    this.scene.add(lights[3])

    // let sphereSize = 0.2
    // this.scene.add( new THREE.PointLightHelper( lights[ 0 ], sphereSize ) )
    // this.scene.add( new THREE.PointLightHelper( lights[ 1 ], sphereSize ) )
    // this.scene.add( new THREE.PointLightHelper( lights[ 2 ], sphereSize ) )
    // this.scene.add( new THREE.PointLightHelper( lights[ 3 ], sphereSize ) )

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x0, 0.2)
    hemiLight.color.setHSL(1, 1, 1)
    hemiLight.groundColor.setHSL(0.095, 1, 0.75)
    hemiLight.up.set(0, 0, 1)
    this.scene.add(hemiLight)

    const group = new THREE.Group()
    this.scene.add(group)
  }

  onWindowResize() {
    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight)
    // this.composer.setSize( this.container.offsetWidth, this.container.offsetHeight )
    this.needsRender = true
  }

  animate() {
    const delta = this.clock.getDelta()

    const hasControlsUpdated = this.cameraHandler.controls.update(delta)
    // const hasOrthoControlsUpdated = this.cameraHandler.cameras[1].controls.update( delta )

    requestAnimationFrame(this.animate.bind(this))

    // you can skip this condition to render though
    if (hasControlsUpdated || this.needsRender) {
      this.needsRender = false
      if (this.stats) this.stats.begin()
      this.render()
      if (this.stats && document.getElementById('info-draws'))
        document.getElementById('info-draws').textContent =
          '' + this.renderer.info.render.calls
      if (this.stats) this.stats.end()
    }
  }

  render() {
    if (this.reflections && this.reflectionsNeedUpdate) {
      // Note: scene based "dynamic" reflections need to be handled a bit more carefully, or else:
      // GL ERROR :GL_INVALID_OPERATION : glDrawElements: Source and destination textures of the draw are the same.
      // First remove the env map from all materials
      for (const obj of this.sceneManager.filteredObjects) {
        obj.material.envMap = null
      }

      // Second, set a scene background color (renderer is transparent by default)
      // and then finally update the cubemap camera.
      this.scene.background = new THREE.Color('#F0F3F8')
      this.cubeCamera.update(this.renderer, this.scene)
      this.scene.background = null

      // Finally, re-set the env maps of all materials
      for (const obj of this.sceneManager.filteredObjects) {
        obj.material.envMap = this.cubeCamera.renderTarget.texture
      }
      this.reflectionsNeedUpdate = false
    }

    this.renderer.render(this.scene, this.cameraHandler.activeCam.camera)
  }

  toggleSectionBox() {
    this.sectionBox.toggle()
  }

  sectionBoxOff() {
    this.sectionBox.off()
  }

  sectionBoxOn() {
    this.sectionBox.on()
  }

  zoomExtents(fit, transition) {
    this.interactions.zoomExtents(fit, transition)
  }

  setProjectionMode(mode) {
    this.cameraHandler.activeCam = mode
  }

  toggleCameraProjection() {
    this.cameraHandler.toggleCameras()
  }

  async loadObject(url, token, enableCaching = true) {
    try {
      if (++this.inProgressOperations === 1) this.emit('busy', true)

      const loader = new ViewerObjectLoader(this, url, token, enableCaching)
      this.loaders[url] = loader
      await loader.load()
    } finally {
      if (--this.inProgressOperations === 0) this.emit('busy', false)
    }
  }

  async cancelLoad(url, unload = false) {
    this.loaders[url].cancelLoad()
    if (unload) {
      await this.unloadObject(url)
    }
    return
  }

  async unloadObject(url) {
    try {
      if (++this.inProgressOperations === 1) this.emit('busy', true)

      await this.loaders[url].unload()
      delete this.loaders[url]
    } finally {
      if (--this.inProgressOperations === 0) this.emit('busy', false)
    }
  }

  async unloadAll() {
    for (const key of Object.keys(this.loaders)) {
      await this.loaders[key].unload()
      delete this.loaders[key]
    }
    await this.applyFilter(null)
    return
  }

  async applyFilter(filter) {
    try {
      if (++this.inProgressOperations === 1) this.emit('busy', true)

      this.interactions.deselectObjects()
      return await this.sceneManager.sceneObjects.applyFilter(filter)
    } finally {
      if (--this.inProgressOperations === 0) this.emit('busy', false)
    }
  }

  getObjectsProperties(includeAll = true) {
    return this.sceneManager.sceneObjects.getObjectsProperties(includeAll)
  }

  dispose() {
    // TODO: currently it's easier to simply refresh the page :)
  }
}
