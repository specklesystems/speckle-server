import Stats from 'three/examples/jsm/libs/stats.module.js'

import EventEmitter from './EventEmitter'

import { Clock, Texture } from 'three'
import { Assets } from './Assets'
import { Optional } from '../helpers/typeHelper'
import {
  DefaultViewerParams,
  IViewer,
  SpeckleView,
  SunLightConfiguration,
  UpdateFlags,
  ViewerEvent,
  ViewerParams
} from '../IViewer'
import { World } from './World'
import { TreeNode, WorldTree } from './tree/WorldTree'
import SpeckleRenderer from './SpeckleRenderer'
import { PropertyInfo, PropertyManager } from './filtering/PropertyManager'
import Logger from 'js-logger'
import { Query, QueryArgsResultMap } from './queries/Query'
import { Queries } from './queries/Queries'
import { Utils } from './Utils'
import { Extension } from './extensions/core-extensions/Extension'
import { ICameraProvider, IProvider } from './extensions/core-extensions/Providers'
import { CameraController } from './extensions/core-extensions/CameraController'
import { SpeckleType } from './loaders/GeometryConverter'
import { Loader } from './loaders/Loader'

export class Viewer extends EventEmitter implements IViewer {
  /** Container and optional stats element */
  protected container: HTMLElement
  protected stats: Optional<Stats>

  /** Viewer params used at init time */
  protected startupParams: ViewerParams

  /** Viewer components */
  protected tree: WorldTree = new WorldTree()
  protected world: World = new World()
  public static Assets: Assets
  public speckleRenderer: SpeckleRenderer
  protected propertyManager: PropertyManager

  /** Misc members */
  protected inProgressOperations: number
  protected clock: Clock
  protected loaders: { [id: string]: Loader } = {}

  protected extensions: {
    [id: string]: Extension | IProvider
  } = {}

  /** various utils/helpers */
  protected utils: Utils
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
    const getConstructorChain = (obj) => {
      const cs = []
      let pt = obj
      do {
        if ((pt = Object.getPrototypeOf(pt))) cs.push(pt.constructor || null)
      } while (pt !== null)
      return cs.map(function (c) {
        return c ? c.toString().split(/\s|\(/)[1] : null
      })
    }
    if (this.extensions[type.name]) return this.extensions[type.name] as T
    else {
      for (const k in this.extensions) {
        const prototypeChain = getConstructorChain(this.extensions[k])
        if (prototypeChain.includes(type.name)) {
          return this.extensions[k] as T
        }
      }
    }
  }

  public constructor(
    container: HTMLElement,
    params: ViewerParams = DefaultViewerParams
  ) {
    super()
    Logger.useDefaults()
    Logger.setLevel(params.verbose ? Logger.TRACE : Logger.ERROR)

    this.container = container || document.getElementById('renderer')
    if (params.showStats) {
      this.stats = Stats()
      this.container.prepend(this.stats.dom)
      this.stats.dom.style.position = 'relative' // Mad CSS skills
    }
    this.loaders = {}
    this.startupParams = params
    this.clock = new Clock()
    this.inProgressOperations = 0

    this.speckleRenderer = new SpeckleRenderer(this)
    this.speckleRenderer.create(this.container)
    window.addEventListener('resize', this.resize.bind(this), false)

    new Assets()
    this.propertyManager = new PropertyManager()

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

  public requestRender(flags: UpdateFlags = UpdateFlags.RENDER) {
    if (flags & UpdateFlags.RENDER) {
      this.speckleRenderer.needsRender = true
      this.speckleRenderer.resetPipeline()
    }
    if (flags & UpdateFlags.SHADOWS) {
      this.speckleRenderer.shadowMapNeedsUpdate = true
    }
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
  ): Promise<PropertyInfo[]> {
    return this.propertyManager.getProperties(this.tree, resourceURL, bypassCache)
  }

  public getDataTree(): void {
    Logger.error('DataTree has been deprecated! Please use WorldTree')
    return null
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

  public async loadObject(loader: Loader, zoomToObject = true) {
    if (++this.inProgressOperations === 1)
      (this as EventEmitter).emit(ViewerEvent.Busy, true)

    this.loaders[loader.resource] = loader
    const treeBuilt = await loader.load()

    if (treeBuilt) {
      const t0 = performance.now()
      for await (const step of this.speckleRenderer.addRenderTree(loader.resource)) {
        step
        if (zoomToObject) {
          const extension = this.getExtension(CameraController)
          if (extension) {
            extension.setCameraView([], false)
            this.speckleRenderer.pipeline.render()
          }
        }
      }
      Logger.log(this.getRenderer().renderingStats)
      Logger.log('ASYNC batch build time -> ', performance.now() - t0)
      this.requestRender(UpdateFlags.RENDER | UpdateFlags.SHADOWS)
      this.speckleRenderer.resetPipeline()
      this.emit(ViewerEvent.LoadComplete, loader.resource)
    }

    this.loaders[loader.resource].dispose()
    delete this.loaders[loader.resource]
    if (--this.inProgressOperations === 0)
      (this as EventEmitter).emit(ViewerEvent.Busy, false)
  }

  public async cancelLoad(resource: string, unload = false) {
    this.loaders[resource].cancel()
    this.tree.getRenderTree(resource).cancelBuild()
    this.speckleRenderer.cancelRenderTree(resource)
    if (unload) {
      await this.unloadObject(resource)
    } else {
      if (--this.inProgressOperations === 0)
        (this as EventEmitter).emit(ViewerEvent.Busy, false)
    }
  }

  public async unloadObject(resource: string) {
    try {
      if (++this.inProgressOperations === 1)
        (this as EventEmitter).emit(ViewerEvent.Busy, true)
      if (this.tree.findSubtree(resource)) {
        delete this.loaders[resource]
        this.speckleRenderer.removeRenderTree(resource)
        this.tree.getRenderTree(resource).purge()
        this.tree.purge(resource)
        this.requestRender(UpdateFlags.RENDER | UpdateFlags.SHADOWS)
      }
    } finally {
      if (--this.inProgressOperations === 0) {
        ;(this as EventEmitter).emit(ViewerEvent.Busy, false)
        Logger.warn(`Removed subtree ${resource}`)
        ;(this as EventEmitter).emit(ViewerEvent.UnloadComplete, resource)
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
