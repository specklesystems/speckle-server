import { Box3, MathUtils } from 'three'

import { SpeckleType } from './loaders/GeometryConverter'
import { Queries } from './queries/Queries'
import { Query, QueryArgsResultMap, QueryResult } from './queries/Query'
import { DataTree, DataTreeBuilder } from './deprecated/DataTree'
import { CameraController } from './extensions/core-extensions/CameraController'
import { SelectionExtension } from './extensions/SelectionExtension'
import { SectionTool } from './extensions/SectionTool'
import { Viewer } from './Viewer'
import {
  DefaultViewerParams,
  IViewer,
  SelectionEvent,
  SpeckleView,
  SunLightConfiguration,
  ViewerParams
} from '../IViewer'
import { SectionOutlines } from './extensions/SectionOutlines'
import { TreeNode, WorldTree } from './tree/WorldTree'
import {
  MeasurementOptions,
  MeasurementsExtension
} from './extensions/measurements/MeasurementsExtension'
import { ExplodeExtension } from './extensions/ExplodeExtension'
import { DiffExtension, DiffResult, VisualDiffMode } from './extensions/DiffExtension'
import { PropertyInfo } from './filtering/PropertyManager'
import { BatchObject } from './batching/BatchObject'
import { SpeckleLoader } from './loaders/Speckle/SpeckleLoader'
import { FilteringExtension, FilteringState } from './extensions/FilteringExtension'
import {
  CanonicalView,
  ICameraProvider,
  InlineView,
  PolarView
} from './extensions/core-extensions/Providers'
import { SelectionExtensionOptions } from './extensions/SelectionExtension'

class LegacySelectionExtension extends SelectionExtension {
  /** FE2 'manually' selects objects pon it's own, so we're disabling the extension's event handler
   * Note: FE2 shouldn't do that, unless it plans on properly extending the SelectionExtension, but we're doing it like this
   * for now in order to reduce the impact on the FE's codebase with the introduction of the new viewer API
   */
  protected onObjectClicked(selection: SelectionEvent) {
    selection
  }
}

class HighlightExtension extends SelectionExtension {
  public constructor(viewer: IViewer, protected cameraProvider: ICameraProvider) {
    super(viewer, cameraProvider)
    const highlightMaterialData: SelectionExtensionOptions = {
      selectionMaterialData: {
        id: MathUtils.generateUUID(),
        color: 0x04cbfb,
        opacity: 1,
        roughness: 1,
        metalness: 0,
        vertexColors: false,
        lineWeight: 1,
        stencilOutlines: false,
        pointSize: 4
      }
    }
    this.options = highlightMaterialData
  }

  public unselectObjects(ids: Array<string>) {
    if (!this._enabled) return
    if (!this.selectedNodes.length) return

    const nodes = []
    for (let k = 0; k < ids.length; k++) {
      nodes.push(...this.viewer.getWorldTree().findId(ids[k]))
    }
    this.clearSelection(
      nodes.filter((node: TreeNode) => {
        return this.selectedNodes.includes(node)
      })
    )
  }

  /** Disable default events */
  protected onObjectClicked(selection: SelectionEvent) {
    selection
  }

  protected onObjectDoubleClick(selection: SelectionEvent) {
    selection
  }

  protected onPointerMove(e) {
    e
  }
}

export class LegacyViewer extends Viewer {
  private cameraController: CameraController = null
  private selection: SelectionExtension = null
  private sections: SectionTool = null
  private sectionOutlines: SectionOutlines = null
  private measurements: MeasurementsExtension = null
  private filtering: FilteringExtension = null
  private explodeExtension: ExplodeExtension = null
  private diffExtension: DiffExtension = null
  private highlightExtension: HighlightExtension = null

  public constructor(
    container: HTMLElement,
    params: ViewerParams = DefaultViewerParams
  ) {
    super(container, params)
    this.cameraController = this.createExtension(CameraController)
    this.selection = this.createExtension(LegacySelectionExtension)
    this.sections = this.createExtension(SectionTool)
    this.sectionOutlines = this.createExtension(SectionOutlines)
    this.measurements = this.createExtension(MeasurementsExtension)
    this.filtering = this.createExtension(FilteringExtension)
    this.explodeExtension = this.createExtension(ExplodeExtension)
    this.diffExtension = this.createExtension(DiffExtension)
    this.highlightExtension = this.createExtension(HighlightExtension)
  }

  public async init(): Promise<void> {
    await super.init()
  }

  public getRenderer() {
    return this.speckleRenderer
  }

  /** SECTION BOX */
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
    this.sections.setBox(box as Box3, offset)
  }

  public getSectionBoxFromObjects(objectIds: string[]) {
    return this.speckleRenderer.boxFromObjects(objectIds)
  }

  public setSectionBoxFromObjects(objectIds: string[], offset?: number) {
    this.setSectionBox(this.getSectionBoxFromObjects(objectIds), offset)
  }

  public getCurrentSectionBox() {
    return this.sections.getBox()
  }

  public toggleSectionBox() {
    this.sections.toggle()
  }

  public sectionBoxOff() {
    this.sections.enabled = false
  }

  public sectionBoxOn() {
    this.sections.enabled = true
  }

  /** FILTERING */
  public selectObjects(objectIds: string[]): Promise<FilteringState> {
    if (objectIds.length) this.highlightExtension.unselectObjects(objectIds)

    this.selection.selectObjects(objectIds)
    if (!this.filtering.filteringState.selectedObjects)
      this.filtering.filteringState.selectedObjects = []
    this.filtering.filteringState.selectedObjects.push(
      ...this.selection.getSelectedObjects().map((obj) => obj.id as string)
    )
    return Promise.resolve(this.filtering.filteringState)
  }

  public resetSelection(): Promise<FilteringState> {
    this.selection.clearSelection()
    if (this.filtering.filteringState.selectedObjects)
      this.filtering.filteringState.selectedObjects.length = 0
    return Promise.resolve(this.filtering.filteringState)
  }

  public hideObjects(
    objectIds: string[],
    stateKey: string = null,
    includeDescendants = false,
    ghost = false
  ): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      this.selection.unselectObjects(objectIds)
      const filteringState = this.filtering.hideObjects(
        objectIds,
        stateKey,
        includeDescendants,
        ghost
      )
      if (!filteringState.selectedObjects) filteringState.selectedObjects = []
      filteringState.selectedObjects.push(
        ...this.selection.getSelectedObjects().map((obj) => obj.id as string)
      )
      resolve(filteringState)
    })
  }

  public showObjects(
    objectIds: string[],
    stateKey: string = null,
    includeDescendants = false
  ): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      const filteringState = this.filtering.showObjects(
        objectIds,
        stateKey,
        includeDescendants
      )
      if (!filteringState.selectedObjects) filteringState.selectedObjects = []
      filteringState.selectedObjects.push(
        ...this.selection.getSelectedObjects().map((obj) => obj.id as string)
      )
      resolve(filteringState)
    })
  }

  public isolateObjects(
    objectIds: string[],
    stateKey: string = null,
    includeDescendants = false,
    ghost = true
  ): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      const filteringState = this.filtering.isolateObjects(
        objectIds,
        stateKey,
        includeDescendants,
        ghost
      )
      if (!filteringState.selectedObjects) filteringState.selectedObjects = []
      filteringState.selectedObjects.push(
        ...this.selection.getSelectedObjects().map((obj) => obj.id as string)
      )
      resolve(filteringState)
    })
  }

  public unIsolateObjects(
    objectIds: string[],
    stateKey: string = null,
    includeDescendants = false
  ): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      const filteringState = this.filtering.unIsolateObjects(
        objectIds,
        stateKey,
        includeDescendants
      )
      if (!filteringState.selectedObjects) filteringState.selectedObjects = []
      filteringState.selectedObjects.push(
        ...this.selection.getSelectedObjects().map((obj) => obj.id as string)
      )
      resolve(filteringState)
    })
  }

  public highlightObjects(objectIds: string[]): Promise<FilteringState> {
    if (!objectIds.length) this.highlightExtension.clearSelection()
    else this.highlightExtension.selectObjects(objectIds)
    return Promise.resolve(this.filtering.filteringState)
  }

  public resetHighlight(): Promise<FilteringState> {
    this.highlightExtension.clearSelection()
    return Promise.resolve(this.filtering.filteringState)
  }

  public setColorFilter(property: PropertyInfo, ghost = true): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      resolve(this.filtering.setColorFilter(property, ghost))
    })
  }

  public removeColorFilter(): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      resolve(this.filtering.removeColorFilter())
    })
  }

  public setUserObjectColors(
    groups: { objectIds: string[]; color: string }[]
  ): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      resolve(this.filtering.setUserObjectColors(groups))
    })
  }

  public resetFilters(): Promise<FilteringState> {
    return new Promise<FilteringState>((resolve) => {
      resolve(this.filtering.resetFilters())
    })
  }

  /** TREE */
  public getDataTree(): DataTree {
    return DataTreeBuilder.build(this.tree)
  }

  public getWorldTree(): WorldTree {
    return this.tree
  }

  /** QUERIES */
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

  /** CAMERA */
  public zoom(objectIds?: string[], fit?: number, transition?: boolean) {
    this.cameraController.setCameraView(objectIds, transition, fit)
  }

  public setOrthoCameraOn() {
    this.cameraController.setOrthoCameraOn()
    this.speckleRenderer.resetPipeline()
  }

  public setPerspectiveCameraOn() {
    this.cameraController.setPerspectiveCameraOn()
    this.speckleRenderer.resetPipeline()
  }

  public toggleCameraProjection() {
    this.cameraController.toggleCameras()
    this.speckleRenderer.resetPipeline()
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

  public setView(
    view: CanonicalView | SpeckleView | InlineView | PolarView,
    transition = true
  ): void {
    this.cameraController.setCameraView(view, transition)
  }

  /** MISC */
  public screenshot(): Promise<string> {
    return new Promise((resolve) => {
      const sectionBoxVisible = this.sections.enabled
      if (sectionBoxVisible) {
        this.sections.visible = false
      }
      const screenshot = this.speckleRenderer.renderer.domElement.toDataURL('image/png')
      if (sectionBoxVisible) {
        this.sections.visible = true
      }
      resolve(screenshot)
    })
  }

  public explode(time: number) {
    this.explodeExtension.setExplode(time)
  }

  public getObjects(id: string): BatchObject[] {
    const nodes = this.tree.findId(id)
    const objects = []
    nodes.forEach((node: TreeNode) => {
      if (node.model.renderView)
        objects.push(this.speckleRenderer.getObject(node.model.renderView))
    })
    return objects
  }

  /**
   * OBJECT LOADING/UNLOADING
   */

  public async loadObjectAsync(
    url: string,
    token: string = null,
    enableCaching = true,
    zoomToObject = true
  ) {
    const loader = new SpeckleLoader(this.tree, url, token, enableCaching)
    return this.loadObject(loader, zoomToObject)
  }

  public async diff(
    urlA: string,
    urlB: string,
    mode: VisualDiffMode,
    authToken?: string
  ): Promise<DiffResult> {
    return this.diffExtension.diff(urlA, urlB, mode, authToken)
  }

  public async undiff() {
    return this.diffExtension.undiff()
  }

  public setDiffTime(diffResult: DiffResult, time: number) {
    this.diffExtension.updateVisualDiff(time)
  }

  public setVisualDiffMode(diffResult: DiffResult, mode: VisualDiffMode) {
    this.diffExtension.updateVisualDiff(undefined, mode)
  }

  public enableMeasurements(value: boolean) {
    this.measurements.enabled = value
    this.selection.enabled = !value
  }

  public setMeasurementOptions(options: MeasurementOptions) {
    this.measurements.options = options
  }

  public removeMeasurement() {
    this.measurements.removeMeasurement()
  }

  public dispose() {
    // TODO: currently it's easier to simply refresh the page :)
  }
}
