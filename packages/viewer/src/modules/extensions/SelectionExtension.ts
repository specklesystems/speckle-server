import { IViewer, SelectionEvent, TreeNode, ViewerEvent } from '../..'
import { ExtendedIntersection } from '../objects/SpeckleRaycaster'
import { Extension } from './core-extensions/Extension'
import { ICameraProvider } from './core-extensions/Providers'
import { ObjectLayers } from '../SpeckleRenderer'
import { NodeRenderView } from '../tree/NodeRenderView'
import { Material } from 'three'
import { InputEvent } from '../input/Input'
import { generateUUID } from 'three/src/math/MathUtils'
import Materials, {
  DisplayStyle,
  MaterialOptions,
  RenderMaterial
} from '../materials/Materials'
export interface SelectionExtensionOptions {
  selectionMaterialData: RenderMaterial & DisplayStyle & MaterialOptions
  hoverMaterialData?: RenderMaterial & DisplayStyle & MaterialOptions
}

const DefaultSelectionExtensionOptions = {
  selectionMaterialData: {
    id: generateUUID(),
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
    const idMap = {}
    for (let k = 0; k < ids.length; k++) {
      idMap[ids[k]] = 1
    }
    if (!multiSelect) {
      this.selectedNodes = []
    }
    this.viewer.getWorldTree().walk((node) => {
      if (idMap[node.model.raw.id]) this.selectedNodes.push(node)
      return true
    })
    this.applySelection()
    this.viewer.requestRender()
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
      [selectionInfo.hits[0].node.model.raw.id as string],
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
        if (!this.selectionRvs[rv.renderData.id])
          this.selectionRvs[rv.renderData.id] = rv
        if (!this.selectionMaterials[rv.renderData.id])
          this.selectionMaterials[rv.renderData.id] = this.viewer
            .getRenderer()
            .getMaterial(rv)
      })
    }

    const rvs = Object.values(this.selectionRvs)
    const opaqueRvs = rvs.filter(
      (value) =>
        this.selectionMaterials[value.renderData.id] &&
        !(
          this.selectionMaterials[value.renderData.id].transparent &&
          this.selectionMaterials[value.renderData.id].opacity < 1
        )
    )
    const transparentRvs = rvs.filter(
      (value) =>
        this.selectionMaterials[value.renderData.id] &&
        this.selectionMaterials[value.renderData.id].transparent &&
        this.selectionMaterials[value.renderData.id].opacity < 1
    )

    this.viewer.getRenderer().setMaterial(opaqueRvs, this.selectionMaterialData)
    this.viewer
      .getRenderer()
      .setMaterial(transparentRvs, this.transparentSelectionMaterialData)
    // setTimeout(() => console.warn(this.viewer.getRenderer().renderingStats), 100)
  }

  protected removeSelection() {
    this.removeHover()
    for (const k in this.selectionRvs) {
      this.viewer
        .getRenderer()
        .setMaterial([this.selectionRvs[k]], this.selectionMaterials[k])
    }
    this.selectionRvs = {}
    this.selectionMaterials = {}
  }

  protected applyHover(renderView: NodeRenderView) {
    this.removeHover()

    if (!renderView) return
    if (this.selectionRvs[renderView.renderData.id]) {
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
  }
}
