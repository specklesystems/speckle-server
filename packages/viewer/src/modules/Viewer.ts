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
  DiffResult,
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
import MeshBatch from './batching/MeshBatch'
import { NodeRenderView } from './tree/NodeRenderView'

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

    this.on(ViewerEvent.LoadCancelled, (url: string) => {
      Logger.warn(`Cancelled load for ${url}`)
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
    groups: { objectIds: string[]; color: string }[]
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

  private async downloadObject(
    url: string,
    token: string = null,
    enableCaching = true
  ) {
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

  public async loadObject(url: string, token: string = null, enableCaching = true) {
    await this.downloadObject(url, token, enableCaching)

    let t0 = performance.now()
    WorldTree.getRenderTree(url).buildRenderTree()
    Logger.log('SYNC Tree build time -> ', performance.now() - t0)

    t0 = performance.now()
    this.speckleRenderer.addRenderTree(url)
    Logger.log('SYNC batch build time -> ', performance.now() - t0)

    this.zoom()
    this.speckleRenderer.resetPipeline(true)
    this.emit(ViewerEvent.LoadComplete, url)
  }

  public async loadObjectAsync(
    url: string,
    token: string = null,
    enableCaching = true,
    priority = 1
  ) {
    await this.downloadObject(url, token, enableCaching)

    let t0 = performance.now()
    const treeBuilt = await WorldTree.getRenderTree(url).buildRenderTreeAsync(priority)
    Logger.log('ASYNC Tree build time -> ', performance.now() - t0)

    if (treeBuilt) {
      t0 = performance.now()
      await this.speckleRenderer.addRenderTreeAsync(url, priority)
      Logger.log('ASYNC batch build time -> ', performance.now() - t0)
      this.speckleRenderer.resetPipeline(true)
      this.emit(ViewerEvent.LoadComplete, url)
    }
  }

  public async cancelLoad(url: string, unload = false) {
    this.loaders[url].cancelLoad()
    WorldTree.getRenderTree(url).cancelBuild(url)
    this.speckleRenderer.cancelRenderTree(url)
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

  public diff(urlA: string, urlB: string): Promise<DiffResult> {
    const diffResult: DiffResult = {
      unchanged: [],
      added: [],
      removed: [],
      modifiedNew: [],
      modifiedOld: []
    }
    const renderTreeA = WorldTree.getRenderTree(urlA)
    const renderTreeB = WorldTree.getRenderTree(urlB)
    const rootA = WorldTree.getInstance().findId(urlA)
    const rootB = WorldTree.getInstance().findId(urlB)
    const rvsA = renderTreeA.getAtomicNodes(SpeckleType.Mesh)
    const rvsB = renderTreeB.getAtomicNodes(SpeckleType.Mesh)
    // console.log(rvsA.map((value: TreeNode) => value.model.raw.id))
    // console.log(rvsB.map((value: TreeNode) => value.model.raw.id))

    for (let k = 0; k < rvsB.length; k++) {
      // console.log('Node -> ', rvsB[k].model.raw.id)
      const res = rootA.first((node: TreeNode) => {
        return rvsB[k].model.raw.id === node.model.raw.id
      })
      if (res) {
        diffResult.unchanged.push(res)
      } else {
        const applicationId = rvsB[k].model.applicationId
          ? rvsB[k].model.raw.applicationId
          : rvsB[k].parent.model.raw.applicationId
        const res2 = rootA.first((node: TreeNode) => {
          return applicationId === node.model.raw.applicationId
        })
        if (res2) {
          diffResult.modifiedNew.push(rvsB[k])
        } else {
          diffResult.added.push(rvsB[k])
        }
      }
    }

    for (let k = 0; k < rvsA.length; k++) {
      // console.log('Node -> ', rvsB[k].model.raw.id)
      const res = rootB.first((node: TreeNode) => {
        return rvsA[k].model.raw.id === node.model.raw.id
      })
      if (!res) {
        const applicationId = rvsA[k].model.applicationId
          ? rvsA[k].model.raw.applicationId
          : rvsA[k].parent.model.raw.applicationId
        const res2 = rootB.first((node: TreeNode) => {
          return applicationId === node.model.raw.applicationId
        })
        if (!res2) diffResult.removed.push(rvsA[k])
        else diffResult.modifiedOld.push(rvsA[k])
      }
    }
    this.setUserObjectColors([
      {
        objectIds: diffResult.added.map((value) => value.model.raw.id),
        color: '#00ff00'
      },
      {
        objectIds: diffResult.removed.map((value) => value.model.raw.id),
        color: '#ff0000'
      },
      {
        objectIds: diffResult.modifiedNew.map((value) => value.model.raw.id),
        color: '#ffff00'
      },
      {
        objectIds: diffResult.modifiedOld.map((value) => value.model.raw.id),
        color: '#ffff00'
      }
    ])
    for (let k = 0; k < diffResult.modifiedOld.length; k++) {
      const rv: NodeRenderView = diffResult.modifiedOld[k].model.renderView
      const batch: MeshBatch = this.speckleRenderer.batcher.getBatch(rv) as MeshBatch
      batch.updateDiffOpacity(rv.vertStart, rv.vertEnd, 0.2)
      batch.renderObject.renderOrder = 1
    }
    for (let k = 0; k < diffResult.removed.length; k++) {
      const rv: NodeRenderView = diffResult.removed[k].model.renderView
      const batch: MeshBatch = this.speckleRenderer.batcher.getBatch(rv) as MeshBatch
      batch.updateDiffOpacity(rv.vertStart, rv.vertEnd, 0.2)
      batch.renderObject.renderOrder = 1
    }

    console.warn(diffResult)
    return Promise.resolve(diffResult)
  }

  public setDiffTime(diffResult: DiffResult, time: number) {
    for (let k = 0; k < diffResult.modifiedOld.length; k++) {
      const rv: NodeRenderView = diffResult.modifiedOld[k].model.renderView
      const batch: MeshBatch = this.speckleRenderer.batcher.getBatch(rv) as MeshBatch
      batch.updateDiffOpacity(
        rv.vertStart,
        rv.vertEnd,
        Math.min(Math.max(time, 0.2), 1)
      )
      batch.renderObject.renderOrder = time > 0.5 ? 0 : 1
    }
    for (let k = 0; k < diffResult.modifiedNew.length; k++) {
      const rv: NodeRenderView = diffResult.modifiedNew[k].model.renderView
      const batch: MeshBatch = this.speckleRenderer.batcher.getBatch(rv) as MeshBatch
      batch.updateDiffOpacity(
        rv.vertStart,
        rv.vertEnd,
        Math.min(Math.max(1 - time, 0.2), 1)
      )
      batch.renderObject.renderOrder = time < 0.5 ? 0 : 1
    }
    for (let k = 0; k < diffResult.removed.length; k++) {
      const rv: NodeRenderView = diffResult.removed[k].model.renderView
      const batch: MeshBatch = this.speckleRenderer.batcher.getBatch(rv) as MeshBatch
      batch.updateDiffOpacity(
        rv.vertStart,
        rv.vertEnd,
        Math.min(Math.max(time, 0.2), 1)
      )
      batch.renderObject.renderOrder = time > 0.5 ? 0 : 1
    }
    for (let k = 0; k < diffResult.added.length; k++) {
      const rv: NodeRenderView = diffResult.added[k].model.renderView
      const batch: MeshBatch = this.speckleRenderer.batcher.getBatch(rv) as MeshBatch
      batch.updateDiffOpacity(
        rv.vertStart,
        rv.vertEnd,
        Math.min(Math.max(1 - time, 0.2), 1)
      )
      batch.renderObject.renderOrder = time < 0.5 ? 0 : 1
    }
  }

  public dispose() {
    // TODO: currently it's easier to simply refresh the page :)
  }
}
