import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module'

import ViewerObjectLoader from './ViewerObjectLoader'
import EventEmitter from './EventEmitter'
import CameraHandler from './context/CameraHanlder'

import SectionBox from './SectionBox'
import { Clock, Texture } from 'three'
import { Assets } from './Assets'
import { Optional } from '../helpers/typeHelper'
import {
  DefaultViewerParams,
  IViewer,
  LightConfiguration,
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

export class Viewer extends EventEmitter implements IViewer {
  /** Container and optional stats element */
  private container: HTMLElement
  private stats: Optional<Stats>

  /** Viewer params used at init time */
  private startupParams: ViewerParams

  /** Viewer components */
  public static Assets: Assets
  private speckleRenderer: SpeckleRenderer
  private filteringManager: FilteringManager
  /** Legacy viewer components (will revisit soon) */
  public sectionBox: SectionBox
  public cameraHandler: CameraHandler

  /** Render flag for on-demand rendering */
  private _needsRender: boolean

  /** Misc members */
  private inProgressOperations: number
  private clock: Clock
  private loaders: { [id: string]: ViewerObjectLoader } = {}

  public get needsRender(): boolean {
    return this._needsRender
  }

  public set needsRender(value: boolean) {
    this._needsRender = value || this._needsRender
  }

  /** Gets the World object. Currently it's used for statistics mostly */
  public get World(): World {
    return World
  }

  public constructor(
    container: HTMLElement,
    params: ViewerParams = DefaultViewerParams
  ) {
    super()

    this.container = container || document.getElementById('renderer')
    if (params.showStats) {
      this.stats = Stats()
      this.container.appendChild(this.stats.dom)
    }
    this.loaders = {}
    this.startupParams = params
    this.clock = new THREE.Clock()
    this.inProgressOperations = 0

    this.speckleRenderer = new SpeckleRenderer(this)
    this.speckleRenderer.create(this.container)
    window.addEventListener('resize', this.onWindowResize.bind(this), false)

    new Assets(this.speckleRenderer.renderer)
    this.filteringManager = new FilteringManager(this.speckleRenderer)

    this.cameraHandler = new CameraHandler(this)
    this.sectionBox = new SectionBox(this)
    this.sectionBox.off()
    this.sectionBox.controls.addEventListener('change', () => {
      this.speckleRenderer.updateClippingPlanes(this.sectionBox.planes)
    })

    this.frame()
    this.onWindowResize()
    this.needsRender = true

    this.on(ViewerEvent.LoadComplete, (url) => {
      WorldTree.getRenderTree(url).buildRenderTree()
      this.speckleRenderer.addRenderTree(url)
      this.zoomExtents()
    })
  }

  private onWindowResize() {
    this.speckleRenderer.renderer.setSize(
      this.container.offsetWidth,
      this.container.offsetHeight
    )
    this.needsRender = true
  }

  private frame() {
    this.update()
    this.render()
  }

  private update() {
    const delta = this.clock.getDelta()
    this.needsRender = this.cameraHandler.controls.update(delta)
    this.speckleRenderer.update(delta)
    this.stats?.update()
    requestAnimationFrame(this.frame.bind(this))
  }

  private render() {
    if (this.needsRender) {
      this.speckleRenderer.render(this.cameraHandler.activeCam.camera)
      this._needsRender = false
    }
  }

  public async init(): Promise<void> {
    if (this.startupParams.environmentSrc) {
      Assets.getEnvironment(this.startupParams.environmentSrc)
        .then((value: Texture) => {
          this.speckleRenderer.indirectIBL = value
        })
        .catch((reason) => {
          console.warn(reason)
          console.warn('Fallback to null environment!')
        })
    }
  }

  public on(eventType: ViewerEvent, listener: (arg) => void): void {
    super.on(eventType, listener)
  }

  public getObjectProperties(resourceURL: string = null): PropertyInfo[] {
    return PropertyManager.getProperties(resourceURL)
  }

  public selectObjects(objectIds: string[]): Promise<void> {
    return new Promise<void>((resolve) => {
      this.filteringManager.selectObjects(objectIds)
      resolve()
    })
  }

  public resetSelection(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.filteringManager.resetSelection()
      resolve()
    })
  }

  public hideObjects(
    objectIds: string[],
    stateKey: string = null,
    includeDescendants = false
  ): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      resolve(
        this.filteringManager.hideObjects(objectIds, stateKey, includeDescendants)
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
    includeDescendants = false
  ): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      resolve(
        this.filteringManager.isolateObjects(objectIds, stateKey, includeDescendants)
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

  public highlightObjects(objectIds: string[]): Promise<void> {
    return new Promise<void>((resolve) => {
      this.filteringManager.highlightObjects(objectIds)
      resolve()
    })
  }

  public resetHighlight(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.filteringManager.resetHighlight()
      resolve()
    })
  }

  public setColorFilter(property: PropertyInfo): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      resolve(this.filteringManager.setColorFilter(property))
    })
  }

  public removeColorFilter(): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      resolve(this.filteringManager.removeColorFilter())
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

  public setLightConfiguration(config: LightConfiguration): void {
    this.speckleRenderer.setSunLightConfiguration(config as SunLightConfiguration)
  }

  public getViews() {
    return WorldTree.getInstance()
      .findAll((node: TreeNode) => {
        return node.model.renderView?.speckleType === SpeckleType.View3D
      })
      .map((v) => {
        return {
          name: v.model.raw.applicationId,
          id: v.model.id,
          view: v.model.raw
        }
      })
  }

  public setView(id: string, transition: boolean): void {
    const view3DNode = WorldTree.getInstance().findId(id)
    this.speckleRenderer.setView(
      view3DNode.model.raw.origin,
      view3DNode.model.raw.target,
      transition
    )
  }

  public rotateTo(side: string, transition = true) {
    this.speckleRenderer.rotateTo(side, transition)
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
        console.warn(`Removed subtree ${url}`)
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
        console.warn(`Removed all subtrees`)
        ;(this as EventEmitter).emit(ViewerEvent.UnloadAllComplete)
      }
    }
  }

  public dispose() {
    // TODO: currently it's easier to simply refresh the page :)
  }
}
