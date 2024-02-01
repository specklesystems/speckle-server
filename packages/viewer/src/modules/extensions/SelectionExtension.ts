import { ExtendedIntersection } from '../objects/SpeckleRaycaster'
import { Extension } from './core-extensions/Extension'
import { ICameraProvider } from './core-extensions/Providers'
import { NodeRenderView } from '../tree/NodeRenderView'
import { Material } from 'three'
import { InputEvent } from '../input/Input'
import { MathUtils } from 'three'
import { IViewer, ObjectLayers, SelectionEvent, ViewerEvent } from '../../IViewer'
import Materials, {
  DisplayStyle,
  MaterialOptions,
  RenderMaterial
} from '../materials/Materials'
import { TreeNode } from '../tree/WorldTree'

export interface SelectionExtensionOptions {
  selectionMaterialData: RenderMaterial & DisplayStyle & MaterialOptions
  hoverMaterialData?: RenderMaterial & DisplayStyle & MaterialOptions
}

const DefaultSelectionExtensionOptions: SelectionExtensionOptions = {
  selectionMaterialData: {
    id: MathUtils.generateUUID(),
    color: 0x047efb,
    opacity: 1,
    roughness: 1,
    metalness: 0,
    vertexColors: false,
    lineWeight: 1,
    stencilOutlines: true,
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
  //   stencilOutlines: true,
  //   pointSize: 4
  // }
}

export class SelectionExtension extends Extension {
  public get inject() {
    return [ICameraProvider.Symbol]
  }

  protected selectedNodes: Array<TreeNode> = []
  protected selectionRvs: { [id: string]: NodeRenderView } = {}
  protected selectionMaterials: { [id: string]: Material } = {}
  protected options: SelectionExtensionOptions
  protected hoverRv: NodeRenderView
  protected hoverMaterial: Material
  protected selectionMaterialData: RenderMaterial & DisplayStyle & MaterialOptions
  protected hoverMaterialData: RenderMaterial & DisplayStyle & MaterialOptions
  protected transparentSelectionMaterialData: RenderMaterial &
    DisplayStyle &
    MaterialOptions
  protected transparentHoverMaterialData: RenderMaterial &
    DisplayStyle &
    MaterialOptions
  protected _enabled = true

  public get enabled() {
    return this._enabled
  }

  public set enabled(value: boolean) {
    this._enabled = value
  }

  public constructor(viewer: IViewer, protected cameraProvider: ICameraProvider) {
    super(viewer)
    this.viewer.on(ViewerEvent.ObjectClicked, this.onObjectClicked.bind(this))
    this.viewer.on(ViewerEvent.ObjectDoubleClicked, this.onObjectDoubleClick.bind(this))
    this.viewer
      .getRenderer()
      .input.on(InputEvent.PointerMove, this.onPointerMove.bind(this))
    this.setOptions(DefaultSelectionExtensionOptions)
  }

  public setOptions(options: SelectionExtensionOptions) {
    this.options = options
    this.selectionMaterialData = Object.assign({}, this.options.selectionMaterialData)
    this.hoverMaterialData = Object.assign({}, this.options.hoverMaterialData)
    this.transparentSelectionMaterialData = Object.assign(
      {},
      this.options.selectionMaterialData
    )
    this.transparentSelectionMaterialData.opacity = 0.5
    this.transparentHoverMaterialData = Object.assign(
      {},
      this.options.hoverMaterialData
    )
    this.transparentHoverMaterialData.opacity = 0.5
  }

  public getSelectedObjects() {
    return this.selectedNodes.map((v) => v.model.raw)
  }

  public selectObjects(ids: Array<string>, multiSelect = false) {
    if (!this._enabled) return

    if (!multiSelect) {
      this.selectedNodes = []
    }

    for (let k = 0; k < ids.length; k++) {
      this.selectedNodes.push(...this.viewer.getWorldTree().findId(ids[k]))
    }

    this.applySelection()
  }

  public unselectObjects(ids: Array<string>) {
    if (!this._enabled) return

    const nodes = []
    for (let k = 0; k < ids.length; k++) {
      nodes.push(...this.viewer.getWorldTree().findId(ids[k]))
    }
    this.clearSelection(nodes)
  }

  public clearSelection(nodes?: Array<TreeNode>) {
    if (!nodes) {
      this.removeSelection()
      this.selectedNodes = []
      return
    }

    const rvs = []
    nodes.forEach((node: TreeNode) => {
      rvs.push(
        ...this.viewer.getWorldTree().getRenderTree().getRenderViewsForNode(node, node)
      )
    })
    this.removeSelection(rvs)

    this.selectedNodes = this.selectedNodes.filter(
      (node: TreeNode) => !nodes.includes(node)
    )
  }

  protected onObjectClicked(selection: SelectionEvent) {
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

  protected onObjectDoubleClick(selectionInfo: SelectionEvent) {
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

  protected onPointerMove(e) {
    if (!this._enabled) return

    if (!this.options.hoverMaterialData) return
    const result =
      (this.viewer
        .getRenderer()
        .intersections.intersect(
          this.viewer.getRenderer().scene,
          this.viewer.getRenderer().renderingCamera,
          e,
          true,
          this.viewer.getRenderer().clippingVolume,
          [
            ObjectLayers.STREAM_CONTENT_MESH,
            ObjectLayers.STREAM_CONTENT_POINT,
            ObjectLayers.STREAM_CONTENT_LINE,
            ObjectLayers.STREAM_CONTENT_TEXT
          ]
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
        .getRenderViewsForNode(this.selectedNodes[k], this.selectedNodes[k])
      rvs.forEach((rv: NodeRenderView) => {
        if (!this.selectionRvs[rv.guid]) this.selectionRvs[rv.guid] = rv
        if (!this.selectionMaterials[rv.guid])
          this.selectionMaterials[rv.guid] = this.viewer.getRenderer().getMaterial(rv)
      })
    }

    const rvs = Object.values(this.selectionRvs)
    const opaqueRvs = rvs.filter(
      (value) =>
        this.selectionMaterials[value.guid] &&
        !(
          this.selectionMaterials[value.guid].transparent &&
          this.selectionMaterials[value.guid].opacity < 1
        )
    )
    const transparentRvs = rvs.filter(
      (value) =>
        this.selectionMaterials[value.guid] &&
        this.selectionMaterials[value.guid].transparent &&
        this.selectionMaterials[value.guid].opacity < 1
    )

    this.viewer.getRenderer().setMaterial(opaqueRvs, this.selectionMaterialData)
    this.viewer
      .getRenderer()
      .setMaterial(transparentRvs, this.transparentSelectionMaterialData)
    this.viewer.requestRender()
  }

  protected removeSelection(rvs?: Array<NodeRenderView>) {
    this.removeHover()

    const materialMap = {}
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

  protected applyHover(renderView: NodeRenderView) {
    this.removeHover()

    if (!renderView) return
    if (this.selectionRvs[renderView.guid]) {
      return
    }
    this.removeHover()

    this.hoverRv = renderView
    this.hoverMaterial = this.viewer.getRenderer().getMaterial(this.hoverRv)
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
    if (this.hoverRv)
      this.viewer.getRenderer().setMaterial([this.hoverRv], this.hoverMaterial)
    this.hoverRv = null
    this.hoverMaterial = null
    this.viewer.requestRender()
  }
}
