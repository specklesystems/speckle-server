import * as THREE from 'three'

import Stats from 'three/examples/jsm/libs/stats.module'

import ViewerObjectLoader from './ViewerObjectLoader'
import EventEmitter from './EventEmitter'
import InteractionHandler from './InteractionHandler'
import CameraHandler from './context/CameraHanlder'

import SectionBox from './SectionBox'
import { Clock, Texture, Vector3 } from 'three'
import { Assets } from './Assets'
import { Optional } from '../helpers/typeHelper'
import { DefaultViewerParams, IViewer, ViewerParams } from '../IViewer'
import { World } from './World'
import { Geometry } from './converter/Geometry'
import { TreeNode, WorldTree } from './tree/WorldTree'
import SpeckleRenderer from './SpeckleRenderer'

export class Viewer extends EventEmitter implements IViewer {
  public speckleRenderer: SpeckleRenderer
  private clock: Clock
  private container: HTMLElement
  private stats: Optional<Stats>
  private loaders: { [id: string]: ViewerObjectLoader } = {}
  public needsRender: boolean
  private inProgressOperations: number

  public sectionBox: SectionBox
  public interactions: InteractionHandler
  public cameraHandler: CameraHandler
  private sceneURL = '' // Temporary
  private startupParams: ViewerParams

  public static Assets: Assets

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
      World.resetWorld()
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
      World.resetWorld()
      await this.loadObject(this.sceneURL, undefined, undefined)
    })()
  }

  public constructor(
    container: HTMLElement,
    params: ViewerParams = DefaultViewerParams
  ) {
    super()

    window.THREE = THREE // Do we really need this?
    this.startupParams = params
    this.clock = new THREE.Clock()

    this.container = container || document.getElementById('renderer')

    this.speckleRenderer = new SpeckleRenderer(this)
    this.speckleRenderer.create(this.container)
    Viewer.Assets = new Assets(this.speckleRenderer.renderer)

    this.cameraHandler = new CameraHandler(this)

    if (params.showStats) {
      this.stats = Stats()
      this.container.appendChild(this.stats.dom)
    }

    window.addEventListener('resize', this.onWindowResize.bind(this), false)

    this.loaders = {}

    this.sectionBox = new SectionBox(this)
    this.sectionBox.off()
    this.sectionBox.controls.addEventListener('change', () => {
      this.speckleRenderer.updateClippingPlanes(this.sectionBox.planes)
    })

    this.interactions = new InteractionHandler(this)

    this.animate()
    this.onWindowResize()
    // this.interactions.zoomExtents()
    this.needsRender = true

    this.inProgressOperations = 0

    this.on('load-complete', (url) => {
      WorldTree.getInstance().walk((node: TreeNode) => {
        node.model.raw.__importedUrl = url
        return true
      })

      WorldTree.getRenderTree().buildRenderTree()
      this.speckleRenderer.addRenderTree()

      console.warn('Built stuff')
    })
  }

  public async init(): Promise<void> {
    if (this.startupParams.environmentSrc) {
      Viewer.Assets.getEnvironment(this.startupParams.environmentSrc)
        .then((value: Texture) => {
          this.speckleRenderer.indirectIBL = value
        })
        .catch((reason) => {
          console.warn(reason)
          console.warn('Fallback to null environment!')
        })
    }
  }

  onWindowResize() {
    this.speckleRenderer.renderer.setSize(
      this.container.offsetWidth,
      this.container.offsetHeight
    )
    this.needsRender = true
  }

  private animate() {
    const delta = this.clock.getDelta()

    const hasControlsUpdated = this.cameraHandler.controls.update(delta)

    requestAnimationFrame(this.animate.bind(this))

    // you can skip this condition to render though
    if (hasControlsUpdated || this.needsRender) {
      // this.needsRender = false
      if (this.stats) this.stats.begin()
      this.render()

      const infoDrawsEl = document.getElementById('info-draws')
      if (this.stats && infoDrawsEl) {
        infoDrawsEl.textContent = '' + this.speckleRenderer.renderer.info.render.calls
      }
      if (this.stats) this.stats.end()
    }
  }

  private render() {
    this.speckleRenderer.renderer.render(
      this.speckleRenderer.scene,
      this.cameraHandler.activeCam.camera
    )
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
    this.speckleRenderer.zoomExtents(fit, transition)
  }

  public setProjectionMode(mode: typeof CameraHandler.prototype.activeCam) {
    this.cameraHandler.activeCam = mode
  }

  public toggleCameraProjection() {
    this.cameraHandler.toggleCameras()
  }

  public async loadObject(
    url: string,
    token: string | undefined,
    enableCaching = true
  ) {
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

  public async applyFilter(filter: unknown) {
    filter
    // try {
    //   if (++this.inProgressOperations === 1) (this as EventEmitter).emit('busy', true)
    //   this.interactions.deselectObjects()
    //   return await this.sceneManager.sceneObjects.applyFilter(filter)
    // } finally {
    //   if (--this.inProgressOperations === 0) (this as EventEmitter).emit('busy', false)
    // }
  }

  public getObjectsProperties() {
    // return this.spceneManager.sceneObjects.getObjectsProperties(includeAll)
    // const props = []
    const flattenObject = function (obj) {
      const flatten = {}
      for (const k in obj) {
        if (['id', '__closure', '__parents', 'bbox', 'totalChildrenCount'].includes(k))
          continue
        const v = obj[k]
        if (v === null || v === undefined || Array.isArray(v)) continue
        if (v.constructor === Object) {
          const flattenProp = flattenObject(v)
          for (const pk in flattenProp) {
            flatten[`${k}.${pk}`] = flattenProp[pk]
          }
          continue
        }
        if (['string', 'number', 'boolean'].includes(typeof v)) flatten[k] = v
      }
      return flatten
    }
    const propValues = {}

    WorldTree.getInstance().walk((node: TreeNode) => {
      const obj = flattenObject(node.model.raw)
      for (const prop of Object.keys(obj)) {
        if (!(prop in propValues)) {
          propValues[prop] = []
        }
        propValues[prop].push(obj[prop])
      }
      return true
    })

    const propInfo = {}
    for (const prop in propValues) {
      const pinfo = {
        type: typeof propValues[prop][0],
        objectCount: propValues[prop].length,
        allValues: propValues[prop],
        uniqueValues: {},
        minValue: propValues[prop][0],
        maxValue: propValues[prop][0]
      }
      for (const v of propValues[prop]) {
        if (v < pinfo.minValue) pinfo.minValue = v
        if (v > pinfo.maxValue) pinfo.maxValue = v
        if (!(v in pinfo.uniqueValues)) {
          pinfo.uniqueValues[v] = 0
        }
        pinfo.uniqueValues[v] += 1
      }

      propInfo[prop] = pinfo
    }
  }

  public dispose() {
    // TODO: currently it's easier to simply refresh the page :)
  }
}
