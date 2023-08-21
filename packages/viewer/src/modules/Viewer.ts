import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'

import ViewerObjectLoader from './ViewerObjectLoader'
import EventEmitter from './EventEmitter'

import { Clock, Texture } from 'three'
import { Assets } from './Assets'
import { Optional } from '../helpers/typeHelper'
import {
  DefaultViewerParams,
  IViewer,
  SpeckleView,
  SunLightConfiguration,
  ViewerEvent,
  ViewerParams
} from '../IViewer'
import { World } from './World'
import { TreeNode, WorldTree } from './tree/WorldTree'
import SpeckleRenderer from './SpeckleRenderer'
import { PropertyInfo, PropertyManager } from './filtering/PropertyManager'
import { GeometryConverter, SpeckleType } from './converter/GeometryConverter'
import { DataTree } from './tree/DataTree'
import Logger from 'js-logger'
import { Query, QueryArgsResultMap, QueryResult } from './queries/Query'
import { Queries } from './queries/Queries'
import { Utils } from './Utils'
import { Extension } from './extensions/core-extensions/Extension'
import { ICameraProvider, IProvider } from './extensions/core-extensions/Providers'
import { CameraController } from '..'
import Input from './input/Input'

export class Viewer extends EventEmitter implements IViewer {
  /** Container and optional stats element */
  private container: HTMLElement
  private stats: Optional<Stats>

  /** Viewer params used at init time */
  private startupParams: ViewerParams

  /** Viewer components */
  private tree: WorldTree = new WorldTree()
  private world: World = new World()
  public static Assets: Assets
  public speckleRenderer: SpeckleRenderer
  private propertyManager: PropertyManager

  /** Misc members */
  private inProgressOperations: number
  private clock: Clock
  private loaders: { [id: string]: ViewerObjectLoader } = {}

  private extensions: {
    [id: string]: Extension | IProvider
  } = {}

  /** various utils/helpers */
  private utils: Utils
  /** Gets the World object. Currently it's used for info mostly */
  public get World(): World {
    return this.world
  }

  public get Utils(): Utils {
    if (!this.utils) {
      this.utils = {
        screenToNDC: this.speckleRenderer.screenToNDC.bind(this.speckleRenderer),
        NDCToScreen: this.speckleRenderer.NDCToScreen.bind(this.speckleRenderer)
      }
    }
    return this.utils
  }

  public get input(): Input {
    return this.speckleRenderer.input
  }

  public createExtension<T extends Extension>(
    type: new (viewer: IViewer, ...args) => T
  ): T {
    const providersToInject = type.prototype.inject
    const providers = []
    Object.values(this.extensions).forEach((extension: IProvider) => {
      const provides = extension.provide
      if (provides && providersToInject.includes(provides)) providers.push(extension)
    })
    const extension = new type(this, ...providers)
    /** Temporary until we implement proper providing for core */
    if (ICameraProvider.isCameraProvider(extension)) {
      this.speckleRenderer.cameraProvider = extension
    }
    this.extensions[type.name] = extension
    return extension
  }

  public getExtension<T extends Extension | IProvider>(
    type: new (viewer: IViewer, ...args) => T
  ): T {
    return this.extensions[type.name] as T
  }

  public constructor(
    container: HTMLElement,
    params: ViewerParams = DefaultViewerParams
  ) {
    super()
    Logger.useDefaults()
    Logger.setLevel(params.verbose ? Logger.TRACE : Logger.ERROR)
    GeometryConverter.keepGeometryData = params.keepGeometryData

    this.container = container || document.getElementById('renderer')
    if (params.showStats) {
      this.stats = Stats()
      this.container.prepend(this.stats.dom)
      this.stats.dom.style.position = 'relative' // Mad CSS skills
    }
    this.loaders = {}
    this.startupParams = params
    this.clock = new THREE.Clock()
    this.inProgressOperations = 0

    // this.cameraHandler = new CameraHandler(this)

    this.speckleRenderer = new SpeckleRenderer(this)
    this.speckleRenderer.create(this.container)
    window.addEventListener('resize', this.resize.bind(this), false)

    new Assets()
    this.propertyManager = new PropertyManager()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any)._V = this // For debugging! ಠ_ಠ

    this.frame()
    this.resize()

    this.on(ViewerEvent.LoadCancelled, (url: string) => {
      Logger.warn(`Cancelled load for ${url}`)
    })
  }

  public getContainer() {
    return this.container
  }

  public getRenderer() {
    return this.speckleRenderer
  }

  public resize() {
    const width = this.container.offsetWidth
    const height = this.container.offsetHeight
    this.speckleRenderer.resize(width, height)
    Object.values(this.extensions).forEach((value: Extension) => {
      value.onResize()
    })
  }

  public requestRender() {
    this.speckleRenderer.needsRender = true
    this.speckleRenderer.resetPipeline()
  }

  private frame() {
    this.update()
    this.render()
  }

  private update() {
    const delta = this.clock.getDelta()
    const extensions = Object.values(this.extensions)
    extensions.forEach((ext: Extension) => {
      ext.onEarlyUpdate(delta)
    })
    this.speckleRenderer.update(delta)
    extensions.forEach((ext: Extension) => {
      ext.onLateUpdate(delta)
    })
    this.stats?.update()
    requestAnimationFrame(this.frame.bind(this))
  }

  private render() {
    this.speckleRenderer.render()
    Object.values(this.extensions).forEach((ext: Extension) => {
      ext.onRender()
    })
  }

  public async init(): Promise<void> {
    if (this.startupParams.environmentSrc) {
      Assets.getEnvironment(
        this.startupParams.environmentSrc,
        this.speckleRenderer.renderer
      )
        .then((value: Texture) => {
          this.speckleRenderer.indirectIBL = value
        })
        .catch((reason) => {
          Logger.error(reason)
          Logger.error('Fallback to null environment!')
        })
    }
  }

  public on(eventType: ViewerEvent, listener: (arg) => void): void {
    super.on(eventType, listener)
  }

  public getObjectProperties(
    resourceURL: string = null,
    bypassCache = true
  ): PropertyInfo[] {
    return this.propertyManager.getProperties(this.tree, resourceURL, bypassCache)
  }

  public getDataTree(): DataTree {
    return this.tree.getDataTree()
  }

  public getWorldTree(): WorldTree {
    return this.tree
  }

  public query<T extends Query>(query: T): QueryArgsResultMap[T['operation']] {
    if (Queries.isPointQuery(query)) {
      Queries.DefaultPointQuerySolver.setContext(this.speckleRenderer)
      return Queries.DefaultPointQuerySolver.solve(query)
    }
    if (Queries.isIntersectionQuery(query)) {
      Queries.DefaultIntersectionQuerySolver.setContext(this.speckleRenderer)
      return Queries.DefaultIntersectionQuerySolver.solve(query)
    }
  }

  public queryAsync(query: Query): Promise<QueryResult> {
    //TO DO
    query
    return null
  }

  public setLightConfiguration(config: SunLightConfiguration): void {
    this.speckleRenderer.setSunLightConfiguration(config)
  }

  public getViews(): SpeckleView[] {
    return this.tree
      .findAll((node: TreeNode) => {
        return node.model.renderView?.speckleType === SpeckleType.View3D
      })
      .map((v) => {
        return {
          name: v.model.raw.applicationId,
          id: v.model.id,
          view: v.model.raw
        } as SpeckleView
      })
  }

  public screenshot(): Promise<string> {
    return new Promise((resolve) => {
      // const sectionBoxVisible = this.sectionBox.display.visible
      // if (sectionBoxVisible) {
      //   this.sectionBox.displayOff()
      // }
      const screenshot = this.speckleRenderer.renderer.domElement.toDataURL('image/png')
      // if (sectionBoxVisible) {
      //   this.sectionBox.displayOn()
      // }
      resolve(screenshot)
    })
  }

  /**
   * OBJECT LOADING/UNLOADING
   */

  private async downloadObject(
    url: string,
    token: string = null,
    enableCaching = true
  ) {
    const loader = new ViewerObjectLoader(this, url, token, enableCaching)
    this.loaders[url] = loader
    await loader.load()
  }

  public async loadObject(
    url: string,
    token: string = null,
    enableCaching = true,
    zoomToObject = true
  ) {
    zoomToObject
    if (++this.inProgressOperations === 1)
      (this as EventEmitter).emit(ViewerEvent.Busy, true)
    await this.downloadObject(url, token, enableCaching)

    let t0 = performance.now()
    this.tree.getRenderTree(url).buildRenderTree()
    Logger.log('SYNC Tree build time -> ', performance.now() - t0)

    t0 = performance.now()
    await this.speckleRenderer.addRenderTree(url)
    Logger.log('SYNC batch build time -> ', performance.now() - t0)

    // if (zoomToObject) this.zoom()

    this.speckleRenderer.resetPipeline(true)
    this.emit(ViewerEvent.LoadComplete, url)
    this.loaders[url].dispose()
    delete this.loaders[url]
    if (--this.inProgressOperations === 0)
      (this as EventEmitter).emit(ViewerEvent.Busy, false)
  }

  public async loadObjectAsync(
    url: string,
    token: string = null,
    enableCaching = true,
    priority = 1,
    zoomToObject = true
  ) {
    if (++this.inProgressOperations === 1)
      (this as EventEmitter).emit(ViewerEvent.Busy, true)
    await this.downloadObject(url, token, enableCaching)

    let t0 = performance.now()
    const treeBuilt = await this.tree.getRenderTree(url).buildRenderTreeAsync(priority)
    Logger.log('ASYNC Tree build time -> ', performance.now() - t0)

    if (treeBuilt) {
      t0 = performance.now()
      for await (const step of this.speckleRenderer.addRenderTreeAsync(url, priority)) {
        step
        if (zoomToObject) {
          const extension = this.getExtension(CameraController)
          if (extension) {
            extension.setCameraView([], false)
          }
        }
      }
      Logger.log(this.getRenderer().renderingStats)
      Logger.log('ASYNC batch build time -> ', performance.now() - t0)
      this.speckleRenderer.resetPipeline(true)
      this.emit(ViewerEvent.LoadComplete, url)
    }
    this.loaders[url].dispose()
    delete this.loaders[url]
    if (--this.inProgressOperations === 0)
      (this as EventEmitter).emit(ViewerEvent.Busy, false)
  }

  public async cancelLoad(url: string, unload = false) {
    this.loaders[url].cancelLoad()
    this.tree.getRenderTree(url).cancelBuild(url)
    this.speckleRenderer.cancelRenderTree(url)
    if (unload) {
      await this.unloadObject(url)
    } else {
      if (--this.inProgressOperations === 0)
        (this as EventEmitter).emit(ViewerEvent.Busy, false)
    }
  }

  public async unloadObject(url: string) {
    try {
      if (++this.inProgressOperations === 1)
        (this as EventEmitter).emit(ViewerEvent.Busy, true)
      delete this.loaders[url]
      this.speckleRenderer.removeRenderTree(url)
      this.tree.getRenderTree(url).purge()
      this.tree.purge(url)
    } finally {
      if (--this.inProgressOperations === 0) {
        ;(this as EventEmitter).emit(ViewerEvent.Busy, false)
        Logger.warn(`Removed subtree ${url}`)
        ;(this as EventEmitter).emit(ViewerEvent.UnloadComplete, url)
      }
    }
  }

  public async unloadAll() {
    try {
      if (++this.inProgressOperations === 1)
        (this as EventEmitter).emit(ViewerEvent.Busy, true)
      for (const key of Object.keys(this.loaders)) {
        delete this.loaders[key]
      }
      this.tree.root.children.forEach((node) => {
        this.speckleRenderer.removeRenderTree(node.model.id)
        this.tree.getRenderTree().purge()
      })

      this.tree.purge()
    } finally {
      if (--this.inProgressOperations === 0) {
        ;(this as EventEmitter).emit(ViewerEvent.Busy, false)
        Logger.warn(`Removed all subtrees`)
        ;(this as EventEmitter).emit(ViewerEvent.UnloadAllComplete)
      }
    }
  }

  public dispose() {
    // TODO: currently it's easier to simply refresh the page :)
  }
}
