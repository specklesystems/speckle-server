import { type ExtendedIntersection } from '../objects/SpeckleRaycaster.js'
import { Extension } from './Extension.js'
import { NodeRenderView } from '../tree/NodeRenderView.js'
import { Material, Vector2 } from 'three'
import { InputEvent } from '../input/Input.js'
import { MathUtils } from 'three'
import {
  type IViewer,
  ObjectLayers,
  type SelectionEvent,
  UpdateFlags,
  ViewerEvent
} from '../../IViewer.js'
import Materials, {
  type DisplayStyle,
  type RenderMaterial
} from '../materials/Materials.js'
import { StencilOutlineType } from '../../IViewer.js'
import { type MaterialOptions } from '../materials/MaterialOptions.js'
import { type TreeNode } from '../tree/WorldTree.js'
import { CameraController } from './CameraController.js'

export interface SelectionExtensionOptions {
  selectionMaterialData: RenderMaterial & DisplayStyle & MaterialOptions
  hoverMaterialData?: RenderMaterial & DisplayStyle & MaterialOptions
}

export const DefaultSelectionExtensionOptions: SelectionExtensionOptions = {
  selectionMaterialData: {
    id: MathUtils.generateUUID(),
    color: 0x047efb,
    emissive: 0x0,
    opacity: 1,
    roughness: 1,
    metalness: 0,
    vertexColors: false,
    lineWeight: 1,
    stencilOutlines: StencilOutlineType.OVERLAY,
    pointSize: 4
  }
  // hoverMaterialData: {
  //   id: generateUUID(),
  //   color: 0xff7377,
  //   opacity: 1,
  //   roughness: 1,
  //   metalness: 0,
  //   vertexColors: false,
  //   lineWeight: 1,
  //   stencilOutlines: StencilOutlineType.OVERLAY,
  //   pointSize: 4
  // }
}

export class SelectionExtension extends Extension {
  public get inject() {
    return [CameraController]
  }

  protected selectedNodes: Array<TreeNode> = []
  protected selectionRvs: { [id: string]: NodeRenderView } = {}
  protected selectionMaterials: { [id: string]: Material } = {}
  protected hoverRv!: NodeRenderView | null
  protected hoverMaterial!: Material | null
  protected selectionMaterialData!: RenderMaterial & DisplayStyle & MaterialOptions
  protected hoverMaterialData!: RenderMaterial & DisplayStyle & MaterialOptions
  protected transparentSelectionMaterialData!: RenderMaterial &
    DisplayStyle &
    MaterialOptions
  protected transparentHoverMaterialData!: RenderMaterial &
    DisplayStyle &
    MaterialOptions
  protected hiddenSelectionMaterialData!: RenderMaterial &
    DisplayStyle &
    MaterialOptions
  protected _enabled = true
  protected _options!: SelectionExtensionOptions

  public get enabled(): boolean {
    return this._enabled
  }

  public set enabled(value: boolean) {
    this._enabled = value
  }

  public get options(): SelectionExtensionOptions {
    return this._options
  }

  public set options(value: SelectionExtensionOptions) {
    this._options = value
    this.selectionMaterialData = Object.assign({}, this.options.selectionMaterialData)
    /** Transparent selection */
    this.transparentSelectionMaterialData = Object.assign(
      {},
      this.options.selectionMaterialData
    )
    this.transparentSelectionMaterialData.opacity = 0.5
    /** Hidden selection */
    this.hiddenSelectionMaterialData = Object.assign(
      {},
      this.options.selectionMaterialData
    )
    this.hiddenSelectionMaterialData.stencilOutlines = StencilOutlineType.OUTLINE_ONLY

    /** Opaque hover */
    this.hoverMaterialData = Object.assign({}, this.options.hoverMaterialData)
    /** Transparent hover */
    this.transparentHoverMaterialData = Object.assign(
      {},
      this.options.hoverMaterialData
    )
    this.transparentHoverMaterialData.opacity = 0.5
  }

  public constructor(viewer: IViewer, protected cameraProvider: CameraController) {
    super(viewer)
    this.viewer.on(ViewerEvent.ObjectClicked, this.onObjectClicked.bind(this))
    this.viewer.on(ViewerEvent.ObjectDoubleClicked, this.onObjectDoubleClick.bind(this))
    this.viewer
      .getRenderer()
      .input.on(InputEvent.PointerMove, this.onPointerMove.bind(this))
    this.options = DefaultSelectionExtensionOptions
  }

  public getSelectedObjects(): Array<Record<string, unknown>> {
    return this.selectedNodes.map((v) => v.model.raw)
  }
  public getSelectedNodes(): Array<TreeNode> {
    return this.selectedNodes
  }

  public selectObjects(ids: Array<string>, multiSelect = false): void {
    if (!this._enabled) return

    if (!multiSelect) {
      this.selectedNodes = []
    }

    for (let k = 0; k < ids.length; k++) {
      const foundNodes = this.viewer.getWorldTree().findId(ids[k])
      if (foundNodes) this.selectedNodes.push(...foundNodes)
    }

    this.applySelection()
  }

  /**TO DO: This is redundant */
  public unselectObjects(ids: Array<string>): void {
    if (!this._enabled) return

    const nodes = []
    for (let k = 0; k < ids.length; k++) {
      const foundNodes = this.viewer.getWorldTree().findId(ids[k])
      if (foundNodes) nodes.push(...foundNodes)
    }
    this.clearSelection(nodes)
  }

  public clearSelection(nodes?: Array<TreeNode>) {
    if (!nodes) {
      this.removeSelection()
      this.selectedNodes = []
      return
    }

    const rvs: Array<NodeRenderView> = []
    nodes.forEach((node: TreeNode) => {
      rvs.push(
        ...this.viewer.getWorldTree().getRenderTree().getRenderViewsForNode(node)
      )
    })
    this.removeSelection(rvs)

    this.selectedNodes = this.selectedNodes.filter(
      (node: TreeNode) => !nodes.includes(node)
    )
  }

  protected onObjectClicked(selection: SelectionEvent | null) {
    if (!this._enabled) return

    if (!selection) {
      this.removeSelection()
      return
    }
    if (selection.multiple) {
      this.selectedNodes.push(selection.hits[0].node)
    } else {
      this.selectedNodes = [selection.hits[0].node]
    }
    this.applySelection()
  }

  protected onObjectDoubleClick(selectionInfo: SelectionEvent | null) {
    if (!this._enabled) return

    if (!selectionInfo) {
      this.cameraProvider.setCameraView([], true)
      return
    }
    this.cameraProvider.setCameraView(
      [selectionInfo.hits[0].node.model.id as string],
      true
    )
  }

  protected onPointerMove(e: Vector2 & { event: Event }) {
    if (!this._enabled) return
    const camera = this.viewer.getRenderer().renderingCamera
    if (!camera) return

    if (!this.options.hoverMaterialData) return
    const result =
      (this.viewer
        .getRenderer()
        .intersections.intersect(
          this.viewer.getRenderer().scene,
          camera,
          e,
          [
            ObjectLayers.STREAM_CONTENT_MESH,
            ObjectLayers.STREAM_CONTENT_POINT,
            ObjectLayers.STREAM_CONTENT_LINE,
            ObjectLayers.STREAM_CONTENT_TEXT
          ],
          true,
          this.viewer.getRenderer().clippingVolume
        ) as ExtendedIntersection[]) || []

    /* TEMPORARY */
    let rv = null
    for (let k = 0; k < result.length; k++) {
      rv = this.viewer.getRenderer().renderViewFromIntersection(result[k])
      if (rv) break
    }

    this.applyHover(rv)
  }

  protected applySelection() {
    this.removeSelection()

    for (let k = 0; k < this.selectedNodes.length; k++) {
      const rvs = this.viewer
        .getWorldTree()
        .getRenderTree()
        .getRenderViewsForNode(this.selectedNodes[k])
      rvs.forEach((rv: NodeRenderView) => {
        if (!this.selectionRvs[rv.guid]) this.selectionRvs[rv.guid] = rv
        if (!this.selectionMaterials[rv.guid]) {
          this.selectionMaterials[rv.guid] = this.viewer
            .getRenderer()
            .getMaterial(rv) as Material
        }
      })
    }

    const rvs = Object.values(this.selectionRvs)
    const opaqueRvs = rvs.filter(
      (value) =>
        this.selectionMaterials[value.guid] &&
        this.selectionMaterials[value.guid].visible &&
        this.selectionMaterials[value.guid] &&
        !(
          this.selectionMaterials[value.guid].transparent &&
          this.selectionMaterials[value.guid].opacity < 1
        )
    )
    const transparentRvs = rvs.filter(
      (value) =>
        this.selectionMaterials[value.guid] &&
        this.selectionMaterials[value.guid].visible &&
        this.selectionMaterials[value.guid] &&
        this.selectionMaterials[value.guid].transparent &&
        this.selectionMaterials[value.guid].opacity < 1
    )
    const hiddenRvs = rvs.filter(
      (value) =>
        this.selectionMaterials[value.guid] &&
        this.selectionMaterials[value.guid].visible === false
    )

    this.viewer.getRenderer().setMaterial(opaqueRvs, this.selectionMaterialData)
    this.viewer
      .getRenderer()
      .setMaterial(transparentRvs, this.transparentSelectionMaterialData)
    this.viewer.getRenderer().setMaterial(hiddenRvs, this.hiddenSelectionMaterialData)
    this.viewer.requestRender(UpdateFlags.RENDER | UpdateFlags.CLIPPING_PLANES)
  }

  protected removeSelection(rvs?: Array<NodeRenderView>) {
    this.removeHover()

    const materialMap: Record<string, { rvs: NodeRenderView[]; matName: string }> = {}
    rvs = rvs ? rvs : Object.values(this.selectionRvs)
    rvs.forEach((rv: NodeRenderView) => {
      const material = this.selectionMaterials[rv.guid]
      if (material) {
        if (!materialMap[material.uuid])
          materialMap[material.uuid] = { rvs: [], matName: material.constructor.name }
        materialMap[material.uuid].rvs.push(rv)
      }
    })

    for (const k in materialMap) {
      this.viewer
        .getRenderer()
        .setMaterial(
          materialMap[k].rvs,
          this.selectionMaterials[materialMap[k].rvs[0].guid]
        )
      materialMap[k].rvs.forEach((rv: NodeRenderView) => {
        delete this.selectionRvs[rv.guid]
        delete this.selectionMaterials[rv.guid]
      })
    }
  }

  protected applyHover(renderView: NodeRenderView | null) {
    this.removeHover()

    if (!renderView) return
    if (this.selectionRvs[renderView.guid]) {
      return
    }
    this.removeHover()

    this.hoverRv = renderView
    this.hoverMaterial = this.viewer.getRenderer().getMaterial(this.hoverRv) as Material
    this.viewer
      .getRenderer()
      .setMaterial(
        [renderView],
        Materials.isTransparent(this.hoverMaterial)
          ? this.transparentHoverMaterialData
          : this.hoverMaterialData
      )

    this.viewer.requestRender()
  }

  protected removeHover() {
    if (this.hoverRv && this.hoverMaterial)
      this.viewer.getRenderer().setMaterial([this.hoverRv], this.hoverMaterial)
    this.hoverRv = null
    this.hoverMaterial = null
    this.viewer.requestRender()
  }
}
