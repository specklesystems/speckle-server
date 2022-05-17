import * as THREE from 'three'

import Stats from 'three/examples/jsm/libs/stats.module'

import ObjectManager from './SceneObjectManager'
import ViewerObjectLoader from './ViewerObjectLoader'
import EventEmitter from './EventEmitter'
import InteractionHandler from './InteractionHandler'
import CameraHandler from './context/CameraHanlder'

import SectionBox from './SectionBox'
import { Box3, Clock, CubeCamera, Vector3 } from 'three'
import { Scene } from 'three'
import { WebGLRenderer } from 'three'
import { Assets } from './Assets'
import { Optional } from '../helpers/typeHelper'
import { DefaultViewerParams, IViewer, ViewerParams } from '../IViewer'
import { World } from './World'
import { Geometry } from './converter/Geometry'

export class Viewer extends EventEmitter implements IViewer {
  private clock: Clock
  private container: HTMLElement
  private cubeCamera: CubeCamera
  private stats: Optional<Stats>
  private loaders: any
  private needsRender: boolean
  private inProgressOperations: number

  public scene: Scene
  public sectionBox: SectionBox
  public sceneManager: ObjectManager
  public interactions: InteractionHandler
  private renderer: WebGLRenderer
  public cameraHandler: CameraHandler
  private sceneURL: string

  public static Assets: Assets

  private _worldSize: Box3 = new Box3()
  private _worldOrigin: Vector3 = new Vector3()
  public get worldSize() {
    World.worldBox.getCenter(this._worldOrigin)
    const size = new Vector3().subVectors(World.worldBox.max, World.worldBox.min)
    return {
      x: size.x,
      y: size.y,
      z: size.z
    }
  }

  public get worldOrigin() {
    return this._worldOrigin
  }

  public get RTE(): boolean {
    return Geometry.USE_RTE
  }

  public set RTE(value: boolean) {
    ;(async () => {
      await this.unloadAll()
      Geometry.USE_RTE = value
      this.sceneManager.initMaterials()
      await this.loadObject(this.sceneURL, undefined, undefined)
    })()
  }

  public get thickLines(): boolean {
    return Geometry.THICK_LINES
  }

  public set thickLines(value: boolean) {
    ;(async () => {
      await this.unloadAll()
      Geometry.THICK_LINES = value
      this.sceneManager.initMaterials()
      await this.loadObject(this.sceneURL, undefined, undefined)
    })()
  }

  public constructor(
    container: HTMLElement,
    params: ViewerParams = DefaultViewerParams
  ) {
    super()

    window.THREE = THREE

    this.clock = new THREE.Clock()

    this.container = container || document.getElementById('renderer')
    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    })
    this.renderer.setClearColor(0xcccccc, 0)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.outputEncoding = THREE.sRGBEncoding
    this.renderer.toneMapping = THREE.LinearToneMapping
    this.renderer.toneMappingExposure = 0.4
    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight)
    this.container.appendChild(this.renderer.domElement)

    Viewer.Assets = new Assets(this.renderer)

    this.cameraHandler = new CameraHandler(this)

    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
      format: THREE.RGBFormat,
      generateMipmaps: true,
      minFilter: THREE.LinearMipmapLinearFilter
    })
    this.cubeCamera = new THREE.CubeCamera(0.1, 10_000, cubeRenderTarget)
    this.scene.add(this.cubeCamera)

    if (params.showStats) {
      this.stats = Stats()
      this.container.appendChild(this.stats.dom)
    }

    window.addEventListener('resize', this.onWindowResize.bind(this), false)

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

  public async init(): Promise<void> {
    this.scene.environment = await Viewer.Assets.getEnvironment(
      'http://localhost:3033/sample-hdri.exr'
    )
  }

  private sceneLights() {
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
    this.needsRender = true
  }

  private animate() {
    const delta = this.clock.getDelta()

    const hasControlsUpdated = this.cameraHandler.controls.update(delta)

    requestAnimationFrame(this.animate.bind(this))

    // you can skip this condition to render though
    if (hasControlsUpdated || this.needsRender) {
      // this.needsRender = false;
      if (this.stats) this.stats.begin()
      this.render()

      const infoDrawsEl = document.getElementById('info-draws')
      if (this.stats && infoDrawsEl) {
        infoDrawsEl.textContent = '' + this.renderer.info.render.calls
      }
      if (this.stats) this.stats.end()
    }
  }

  private render() {
    this.renderer.render(this.scene, this.cameraHandler.activeCam.camera)
  }

  public toggleSectionBox() {
    this.sectionBox.toggle()
  }

  public sectionBoxOff() {
    this.sectionBox.off()
  }

  public sectionBoxOn() {
    this.sectionBox.on()
  }

  public zoomExtents(fit?: number, transition?: boolean) {
    this.interactions.zoomExtents(fit, transition)
  }

  public setProjectionMode(mode: typeof CameraHandler.prototype.activeCam) {
    this.cameraHandler.activeCam = mode
  }

  public toggleCameraProjection() {
    this.cameraHandler.toggleCameras()
  }

  public async loadObject(url: string, token: string, enableCaching = true) {
    try {
      if (++this.inProgressOperations === 1) (this as EventEmitter).emit('busy', true)

      const loader = new ViewerObjectLoader(this, url, token, enableCaching)
      this.loaders[url] = loader
      await loader.load()
    } finally {
      if (--this.inProgressOperations === 0) (this as EventEmitter).emit('busy', false)
      this.sceneURL = url
    }
  }

  public async cancelLoad(url: string, unload = false) {
    this.loaders[url].cancelLoad()
    if (unload) {
      await this.unloadObject(url)
    }
    return
  }

  public async unloadObject(url: string) {
    try {
      if (++this.inProgressOperations === 1) (this as EventEmitter).emit('busy', true)

      await this.loaders[url].unload()
      delete this.loaders[url]
    } finally {
      if (--this.inProgressOperations === 0) (this as EventEmitter).emit('busy', false)
    }
  }

  public async unloadAll() {
    for (const key of Object.keys(this.loaders)) {
      await this.loaders[key].unload()
      delete this.loaders[key]
    }
    await this.applyFilter(null)
    return
  }

  public async applyFilter(filter: any) {
    try {
      if (++this.inProgressOperations === 1) (this as EventEmitter).emit('busy', true)

      this.interactions.deselectObjects()
      return await this.sceneManager.sceneObjects.applyFilter(filter)
    } finally {
      if (--this.inProgressOperations === 0) (this as EventEmitter).emit('busy', false)
    }
  }

  public getObjectsProperties(includeAll = true) {
    return this.sceneManager.sceneObjects.getObjectsProperties(includeAll)
  }

  public dispose() {
    // TODO: currently it's easier to simply refresh the page :)
  }
}
