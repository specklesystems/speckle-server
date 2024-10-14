import EventEmitter from './EventEmitter.js'

import { Clock, Texture } from 'three'
import { Assets } from './Assets.js'
import { type Optional } from '../helpers/typeHelper.js'
import {
  DefaultViewerParams,
  type IViewer,
  type SpeckleView,
  type SunLightConfiguration,
  UpdateFlags,
  ViewerEvent,
  type ViewerParams,
  type ViewerEventPayload
} from '../IViewer.js'
import { World } from './World.js'
import { type TreeNode, WorldTree } from './tree/WorldTree.js'
import SpeckleRenderer from './SpeckleRenderer.js'
import { type PropertyInfo, PropertyManager } from './filtering/PropertyManager.js'
import type { Query, QueryArgsResultMap } from './queries/Query.js'
import { Queries } from './queries/Queries.js'
import { type Utils } from './Utils.js'
import { Extension } from './extensions/Extension.js'
import Input from './input/Input.js'
import { CameraController } from './extensions/CameraController.js'
import { SpeckleType } from './loaders/GeometryConverter.js'
import { Loader } from './loaders/Loader.js'
import { type Constructor } from 'type-fest'
import { RenderTree } from './tree/RenderTree.js'
import Logger from './utils/Logger.js'
import Stats from './three/stats.js'

export class Viewer extends EventEmitter implements IViewer {
  /** Container and optional stats element */
  protected container: HTMLElement
  protected stats: Optional<ReturnType<typeof Stats>>

  /** Viewer params used at init time */
  protected startupParams: ViewerParams

  /** Viewer components */
  protected tree: WorldTree = new WorldTree()
  protected world: World = new World()
  public static readonly theAssets: Assets = new Assets()
  public speckleRenderer: SpeckleRenderer
  protected propertyManager: PropertyManager

  /** Misc members */
  protected inProgressOperations: number
  protected clock: Clock
  protected loaders: { [id: string]: Loader } = {}

  protected extensions: {
    [id: string]: Extension
  } = {}

  /** various utils/helpers */
  protected utils: Utils | undefined
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

  private getConstructorChain(obj: object) {
    const cs = []
    let pt = obj
    do {
      if ((pt = Object.getPrototypeOf(pt))) cs.push(pt.constructor || null)
    } while (pt !== null)
    return cs.map(function (c) {
      return c ? c.toString().split(/\s|\(/)[1] : null
    })
  }

  public createExtension<T extends Extension>(type: Constructor<T>): T {
    const extensionsToInject: Array<
      new (viewer: IViewer, ...args: Extension[]) => Extension
    > = type.prototype.inject
    const injectedExtensions: Array<Extension> = []
    extensionsToInject.forEach(
      (value: new (viewer: IViewer, ...args: Extension[]) => Extension) => {
        if (this.extensions[value.name]) {
          injectedExtensions.push(this.extensions[value.name])
          return
        }
        for (const k in this.extensions) {
          const prototypeChain = this.getConstructorChain(this.extensions[k])
          if (prototypeChain.includes(value.name)) {
            injectedExtensions.push(this.extensions[k])
          }
        }
      }
    )

    const extension = new type(this, ...injectedExtensions)
    this.extensions[type.name] = extension
    return extension
  }

  public getExtension<T extends Extension>(type: Constructor<T>): T {
    let extension
    if ((extension = this.getExtensionInternal(type)) !== null) return extension

    throw new Error(`Could not get Extension of type ${type.name}. Is it created?`)
  }

  public hasExtension<T extends Extension>(type: Constructor<T>): boolean {
    const extension = this.getExtensionInternal(type)
    return extension ? true : false
  }

  private getExtensionInternal<T extends Extension>(type: Constructor<T>): T | null {
    if (this.extensions[type.name]) return this.extensions[type.name] as T
    else {
      for (const k in this.extensions) {
        const prototypeChain = this.getConstructorChain(this.extensions[k])
        if (prototypeChain.includes(type.name)) {
          return this.extensions[k] as T
        }
      }
    }
    return null
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

    this.speckleRenderer = new SpeckleRenderer(this.tree, this)
    this.speckleRenderer.create(this.container)
    window.addEventListener('resize', this.resize.bind(this), false)

    this.propertyManager = new PropertyManager()

    this.frame()
    this.resize()
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
    }
    if (flags & UpdateFlags.SHADOWS) {
      this.speckleRenderer.shadowMapNeedsUpdate = true
    }
    if (flags & UpdateFlags.CLIPPING_PLANES) {
      this.speckleRenderer.updateClippingPlanes()
    }
    if (flags & UpdateFlags.RENDER_RESET) {
      this.speckleRenderer.needsRender = true
      this.speckleRenderer.resetPipeline()
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
          Logger.error('Environment failed to load!')
        })
    }
  }

  on<T extends ViewerEvent>(
    eventType: T,
    listener: (arg: ViewerEventPayload[T]) => void
  ): void {
    super.on(eventType, listener)
  }

  public getObjectProperties(
    resourceURL: string | null = null,
    bypassCache = true
  ): Promise<PropertyInfo[]> {
    return this.propertyManager.getProperties(this.tree, resourceURL, bypassCache)
  }

  public getDataTree(): void {
    Logger.error('DataTree has been deprecated! Please use WorldTree')
  }

  public getWorldTree(): WorldTree {
    return this.tree
  }

  public query<T extends Query>(query: T): QueryArgsResultMap[T['operation']] | null {
    if (Queries.isPointQuery(query)) {
      Queries.DefaultPointQuerySolver.setContext(this.speckleRenderer)
      return Queries.DefaultPointQuerySolver.solve(query)
    }
    if (Queries.isIntersectionQuery(query)) {
      Queries.DefaultIntersectionQuerySolver.setContext(this.speckleRenderer)
      return Queries.DefaultIntersectionQuerySolver.solve(query)
    }

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
      .map((v: TreeNode) => {
        return v.model.raw as SpeckleView
      })
  }

  public screenshot(): Promise<string> {
    return new Promise((resolve) => {
      // const sectionBoxVisible = this.sectionBox.display.visible
      // if (sectionBoxVisible) {
      //   this.sectionBox.visible = false
      // }
      const screenshot = this.speckleRenderer.renderer.domElement.toDataURL('image/png')
      // if (sectionBoxVisible) {
      //   this.sectionBox.visible = true
      // }
      resolve(screenshot)
    })
  }

  /**
   * OBJECT LOADING/UNLOADING
   */

  public async loadObject(loader: Loader, zoomToObject = true) {
    if (zoomToObject) {
      this.getExtension(CameraController)?.default()
    }
    if (++this.inProgressOperations === 1) this.emit(ViewerEvent.Busy, true)

    this.loaders[loader.resource] = loader
    const treeBuilt = await loader.load()
    if (treeBuilt) {
      const renderTree: RenderTree | null = this.tree.getRenderTree(loader.resource)
      /** Catering to typescript
       *  The render tree can't be null, we've just built it
       */
      if (!renderTree) {
        throw new Error(`Could not get render tree ${loader.resource}`)
      }
      const t0 = performance.now()
      for await (const step of this.speckleRenderer.addRenderTree(renderTree)) {
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
      this.requestRender(UpdateFlags.RENDER_RESET | UpdateFlags.SHADOWS)
      this.emit(ViewerEvent.LoadComplete, loader.resource)
    }

    if (this.loaders[loader.resource]) this.loaders[loader.resource].dispose()
    delete this.loaders[loader.resource]
    if (--this.inProgressOperations === 0) this.emit(ViewerEvent.Busy, false)
  }

  public async cancelLoad(resource: string, unload = false) {
    this.loaders[resource].cancel()
    this.tree.getRenderTree(resource)?.cancelBuild()
    this.speckleRenderer.cancelRenderTree(resource)
    if (unload) {
      await this.unloadObject(resource)
    } else {
      if (--this.inProgressOperations === 0) this.emit(ViewerEvent.Busy, false)
    }
  }

  public async unloadObject(resource: string) {
    try {
      if (++this.inProgressOperations === 1) this.emit(ViewerEvent.Busy, true)
      if (this.tree.findSubtree(resource)) {
        if (this.loaders[resource]) {
          await this.cancelLoad(resource, true)
          return
        }
        delete this.loaders[resource]
        this.speckleRenderer.removeRenderTree(resource)
        this.tree.getRenderTree(resource)?.purge()
        this.tree.purge(resource)
        this.requestRender(UpdateFlags.RENDER | UpdateFlags.SHADOWS)
      }
    } finally {
      if (--this.inProgressOperations === 0) {
        this.emit(ViewerEvent.Busy, false)
        Logger.warn(`Removed subtree ${resource}`)
        this.emit(ViewerEvent.UnloadComplete, resource)
      }
    }
  }

  public async unloadAll() {
    try {
      if (++this.inProgressOperations === 1) this.emit(ViewerEvent.Busy, true)
      for (const key of Object.keys(this.loaders)) {
        if (this.loaders[key]) await this.cancelLoad(key, false)
        delete this.loaders[key]
      }
      this.tree.root.children.forEach((node: TreeNode) => {
        this.speckleRenderer.removeRenderTree(node.model.id)
        this.tree.getRenderTree()?.purge()
      })

      this.tree.purge()
    } finally {
      if (--this.inProgressOperations === 0) {
        this.emit(ViewerEvent.Busy, false)
        Logger.warn(`Removed all subtrees`)
        this.emit(ViewerEvent.UnloadAllComplete)
      }
    }
  }

  public dispose() {
    // TODO: currently it's easier to simply refresh the page :)
  }
}
