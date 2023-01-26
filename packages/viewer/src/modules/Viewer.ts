import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module'

import ViewerObjectLoader from './ViewerObjectLoader'
import EventEmitter from './EventEmitter'
import CameraHandler from './context/CameraHanlder'

import SectionBox, { SectionBoxEvent } from './SectionBox'
import { Clock, Texture } from 'three'
import { Assets } from './Assets'
import { Optional } from '../helpers/typeHelper'
import {
  CanonicalView,
  DefaultViewerParams,
  InlineView,
  IViewer,
  PolarView,
  SpeckleView,
  SunLightConfiguration,
  ViewerEvent,
  ViewerParams
} from '../IViewer'
import { World } from './World'
import { TreeNode, WorldTree } from './tree/WorldTree'
import SpeckleRenderer from './SpeckleRenderer'
import { FilteringManager, FilteringState } from './filtering/FilteringManager'
import { PropertyInfo, PropertyManager } from './filtering/PropertyManager'
import { SpeckleType } from './converter/GeometryConverter'
import { DataTree } from './tree/DataTree'
import Logger from 'js-logger'
import { Query, QueryArgsResultMap, QueryResult } from './queries/Query'
import { Queries } from './queries/Queries'
import { Utils } from './Utils'

export class Viewer extends EventEmitter implements IViewer {
  /** Container and optional stats element */
  private container: HTMLElement
  private stats: Optional<Stats>

  /** Viewer params used at init time */
  private startupParams: ViewerParams

  /** Viewer components */
  private static world: World = new World()
  public static Assets: Assets
  protected speckleRenderer: SpeckleRenderer
  private filteringManager: FilteringManager
  /** Legacy viewer components (will revisit soon) */
  public sectionBox: SectionBox
  public cameraHandler: CameraHandler

  /** Misc members */
  private inProgressOperations: number
  private clock: Clock
  private loaders: { [id: string]: ViewerObjectLoader } = {}

  /** various utils/helpers */
  private utils: Utils
  /** Gets the World object. Currently it's used for info mostly */
  public static get World(): World {
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
      this.container.appendChild(this.stats.dom)
    }
    this.loaders = {}
    this.startupParams = params
    this.clock = new THREE.Clock()
    this.inProgressOperations = 0

    this.cameraHandler = new CameraHandler(this)

    this.speckleRenderer = new SpeckleRenderer(this)
    this.speckleRenderer.create(this.container)
    window.addEventListener('resize', this.resize.bind(this), false)

    new Assets(this.speckleRenderer.renderer)
    this.filteringManager = new FilteringManager(this.speckleRenderer)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any)._V = this // For debugging! ಠ_ಠ

    this.sectionBox = new SectionBox(this)
    this.sectionBox.disable()
    this.on(ViewerEvent.SectionBoxUpdated, () => {
      this.speckleRenderer.updateClippingPlanes(this.sectionBox.planes)
    })
    this.sectionBox.on(
      SectionBoxEvent.DRAG_START,
      this.speckleRenderer.onSectionBoxDragStart.bind(this.speckleRenderer)
    )
    this.sectionBox.on(
      SectionBoxEvent.DRAG_END,
      this.speckleRenderer.onSectionBoxDragEnd.bind(this.speckleRenderer)
    )

    this.frame()
    this.resize()

    this.on(ViewerEvent.LoadComplete, (url) => {
      WorldTree.getRenderTree(url).buildRenderTree()
      this.speckleRenderer.addRenderTree(url)
      this.zoom()
      this.speckleRenderer.resetPipeline(true)
    })
  }
  public setSectionBox(
    box?: {
      min: {
        x: number
        y: number
        z: number
      }
      max: { x: number; y: number; z: number }
    },
    offset?: number
  ) {
    if (!box) {
      box = this.speckleRenderer.sceneBox
    }
    this.sectionBox.setBox(box, offset)
    this.speckleRenderer.updateSectionBoxCapper()
  }
  public setSectionBoxFromObjects(objectIds: string[], offset?: number) {
    this.setSectionBox(this.speckleRenderer.boxFromObjects(objectIds), offset)
  }

  public getCurrentSectionBox() {
    return this.sectionBox.getCurrentBox()
  }

  public resize() {
    const width = this.container.offsetWidth
    const height = this.container.offsetHeight
    this.speckleRenderer.resize(width, height)
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
    this.speckleRenderer.update(delta)
    this.stats?.update()
    requestAnimationFrame(this.frame.bind(this))
  }

  private render() {
    this.speckleRenderer.render()
  }

  public async init(): Promise<void> {
    if (this.startupParams.environmentSrc) {
      Assets.getEnvironment(this.startupParams.environmentSrc)
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
    return PropertyManager.getProperties(resourceURL, bypassCache)
  }

  public selectObjects(objectIds: string[]): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      resolve(this.filteringManager.selectObjects(objectIds))
    })
  }

  public resetSelection(): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      resolve(this.filteringManager.resetSelection())
    })
  }

  public hideObjects(
    objectIds: string[],
    stateKey: string = null,
    includeDescendants = false,
    ghost = false
  ): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      resolve(
        this.filteringManager.hideObjects(
          objectIds,
          stateKey,
          includeDescendants,
          ghost
        )
      )
    })
  }

  public showObjects(
    objectIds: string[],
    stateKey: string = null,
    includeDescendants = false
  ): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      resolve(
        this.filteringManager.showObjects(objectIds, stateKey, includeDescendants)
      )
    })
  }

  public isolateObjects(
    objectIds: string[],
    stateKey: string = null,
    includeDescendants = false,
    ghost = true
  ): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      resolve(
        this.filteringManager.isolateObjects(
          objectIds,
          stateKey,
          includeDescendants,
          ghost
        )
      )
    })
  }

  public unIsolateObjects(
    objectIds: string[],
    stateKey: string = null,
    includeDescendants = false
  ): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      resolve(
        this.filteringManager.unIsolateObjects(objectIds, stateKey, includeDescendants)
      )
    })
  }

  public highlightObjects(objectIds: string[], ghost = false): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      resolve(this.filteringManager.highlightObjects(objectIds, ghost))
    })
  }

  public resetHighlight(): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      resolve(this.filteringManager.resetHighlight())
    })
  }

  public setColorFilter(property: PropertyInfo, ghost = true): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      resolve(this.filteringManager.setColorFilter(property, ghost))
    })
  }

  public removeColorFilter(): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      resolve(this.filteringManager.removeColorFilter())
    })
  }

  public setUserObjectColors(
    groups: [{ objectIds: string[]; color: string }]
  ): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      resolve(this.filteringManager.setUserObjectColors(groups))
    })
  }

  public resetFilters(): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      resolve(this.filteringManager.reset())
    })
  }

  /**
   * LEGACY: Handles (or tries to handle) old viewer filtering.
   * @param args legacy filter object
   */
  public async applyFilter(filter: unknown) {
    filter
    // return this.FilteringManager.handleLegacyFilter(filter)
  }

  public getDataTree(): DataTree {
    return WorldTree.getDataTree()
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

  public toggleSectionBox() {
    this.sectionBox.toggle()
    this.speckleRenderer.updateSectionBoxCapper()
  }

  public sectionBoxOff() {
    this.sectionBox.disable()
    this.speckleRenderer.updateSectionBoxCapper()
  }

  public sectionBoxOn() {
    this.sectionBox.enable()
    this.speckleRenderer.updateSectionBoxCapper()
  }

  public zoom(objectIds?: string[], fit?: number, transition?: boolean) {
    this.speckleRenderer.zoom(objectIds, fit, transition)
  }

  public setProjectionMode(mode: typeof CameraHandler.prototype.activeCam) {
    this.cameraHandler.activeCam = mode
  }

  public toggleCameraProjection() {
    this.cameraHandler.toggleCameras()
    this.speckleRenderer.resetPipeline(true)
  }

  public setLightConfiguration(config: SunLightConfiguration): void {
    this.speckleRenderer.setSunLightConfiguration(config)
  }

  public getViews(): SpeckleView[] {
    return WorldTree.getInstance()
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

  public setView(
    view: CanonicalView | SpeckleView | InlineView | PolarView,
    transition = true
  ): void {
    this.speckleRenderer.setView(view, transition)
  }

  public screenshot(): Promise<string> {
    return new Promise((resolve) => {
      const sectionBoxVisible = this.sectionBox.display.visible
      if (sectionBoxVisible) {
        this.sectionBox.displayOff()
      }
      const screenshot = this.speckleRenderer.renderer.domElement.toDataURL('image/png')
      if (sectionBoxVisible) {
        this.sectionBox.displayOn()
      }
      resolve(screenshot)
    })
  }

  /**
   * OBJECT LOADING/UNLOADING
   */
  public async loadObject(url: string, token: string = null, enableCaching = true) {
    try {
      if (++this.inProgressOperations === 1)
        (this as EventEmitter).emit(ViewerEvent.Busy, true)

      const loader = new ViewerObjectLoader(this, url, token, enableCaching)
      this.loaders[url] = loader
      await loader.load()
    } finally {
      if (--this.inProgressOperations === 0)
        (this as EventEmitter).emit(ViewerEvent.Busy, false)
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
      if (++this.inProgressOperations === 1)
        (this as EventEmitter).emit(ViewerEvent.Busy, true)
      delete this.loaders[url]
      this.speckleRenderer.removeRenderTree(url)
      WorldTree.getRenderTree(url).purge()
      WorldTree.getInstance().purge(url)
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
      this.filteringManager.reset()
      WorldTree.getInstance().root.children.forEach((node) => {
        this.speckleRenderer.removeRenderTree(node.model.id)
        WorldTree.getRenderTree().purge()
      })

      WorldTree.getInstance().purge()
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
