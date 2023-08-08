import { IViewer, SelectionEvent, TreeNode, ViewerEvent } from '../..'
import SpeckleGhostMaterial from '../materials/SpeckleGhostMaterial'
import SpeckleMesh from '../objects/SpeckleMesh'
import { ExtendedIntersection } from '../objects/SpeckleRaycaster'
import { Extension } from './core-extensions/Extension'
import { ICameraProvider } from './core-extensions/Providers'
import { ObjectLayers } from '../SpeckleRenderer'
import { NodeRenderView } from '../tree/NodeRenderView'
import SpeckleStandardMaterial from '../materials/SpeckleStandardMaterial'
import { Color, DoubleSide, Material } from 'three'
import { InputEvent } from '../input/Input'
import MeshBatch from '../batching/MeshBatch'
export interface SelectionExtensionOptions {
  selectionColor: number
  highlightOnHover: boolean
}

const DefaultSelectionExtensionOptions = {
  selectionColor: 0x047efb,
  highlightOnHover: false
}

export class SelectionExtension extends Extension {
  public get inject() {
    return [ICameraProvider.Symbol]
  }

  protected selectedNodes: Array<TreeNode> = []
  protected selectionRvs: { [id: string]: NodeRenderView } = {}
  protected selectionMaterials: { [id: string]: Material } = {}
  protected options: SelectionExtensionOptions = DefaultSelectionExtensionOptions
  protected hoverRv: NodeRenderView
  protected hoverMaterial: Material
  protected selectionMaterial: SpeckleStandardMaterial
  protected transparentSelectionMaterial: SpeckleStandardMaterial
  protected highlightMaterial: SpeckleStandardMaterial

  public constructor(viewer: IViewer, protected cameraProvider: ICameraProvider) {
    super(viewer)
    this.viewer.on(ViewerEvent.ObjectClicked, this.onObjectClicked.bind(this))
    this.viewer.on(ViewerEvent.ObjectDoubleClicked, this.onObjectDoubleClick.bind(this))
    this.viewer
      .getRenderer()
      .input.on(InputEvent.PointerMove, this.onPointerMove.bind(this))

    this.selectionMaterial = new SpeckleStandardMaterial(
      {
        color: 0x047efb,
        emissive: 0x0,
        roughness: 1,
        metalness: 0,
        side: DoubleSide
      },
      ['USE_RTE']
    )
    this.selectionMaterial.color.convertSRGBToLinear()

    this.transparentSelectionMaterial = this.selectionMaterial.clone()
    this.transparentSelectionMaterial.transparent = true
    this.transparentSelectionMaterial.opacity = 0.5

    this.highlightMaterial = new SpeckleStandardMaterial(
      {
        color: 0xffffff,
        emissive: 0x0,
        roughness: 1,
        metalness: 0,
        side: DoubleSide,
        envMapIntensity: 2
      },
      ['USE_RTE']
    )
  }

  public onUpdate() {
    // UNIMPLEMENTED
  }

  public onRender() {
    // UNIMPLEMENTED
  }

  public onResize() {
    //UNIMPLEMENTED
  }

  public getSelectedObjects() {
    return this.selectedNodes.map((v) => v.model.raw)
  }

  public selectObjects(ids: Array<string>, multiSelect = false) {
    const start = performance.now()
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
    const time = performance.now() - start
    console.warn('Split -> ', MeshBatch.split)
    console.warn('Split2 -> ', MeshBatch.split2)
    console.warn('Split3 -> ', MeshBatch.split3)
    console.warn('Time -> ', time)
    this.viewer.requestRender()
  }

  protected onObjectClicked(selection: SelectionEvent) {
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
    if (!this.options.highlightOnHover) return
    let result =
      (this.viewer
        .getRenderer()
        .intersections.intersect(
          this.viewer.getRenderer().scene,
          this.viewer.getRenderer().renderingCamera,
          e,
          true,
          this.viewer.getRenderer().clippingVolume,
          [ObjectLayers.STREAM_CONTENT_MESH]
        ) as ExtendedIntersection[]) || []

    result = result.filter((value: ExtendedIntersection) => {
      const material = (value.object as unknown as SpeckleMesh).getBatchObjectMaterial(
        value.batchObject
      )
      return !(material instanceof SpeckleGhostMaterial) && material.visible
    })
    const rv = result.length ? result[0].batchObject.renderView : null
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
        !this.selectionMaterials[value.renderData.id].transparent
    )
    const transparentRvs = rvs.filter(
      (value) =>
        this.selectionMaterials[value.renderData.id] &&
        this.selectionMaterials[value.renderData.id].transparent
    )
    this.viewer
      .getRenderer()
      .setMaterial(Object.values(opaqueRvs), this.selectionMaterial)
    this.viewer
      .getRenderer()
      .setMaterial(Object.values(transparentRvs), this.transparentSelectionMaterial)
  }

  protected removeSelection() {
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

    if (renderView) {
      this.hoverRv = renderView
      this.hoverMaterial = this.viewer.getRenderer().getMaterial(this.hoverRv)
      this.copyHoverMaterial(this.hoverMaterial)
      this.viewer.getRenderer().setMaterial([renderView], this.highlightMaterial)
    }
    this.viewer.requestRender()
  }

  protected removeHover() {
    if (this.hoverRv)
      this.viewer.getRenderer().setMaterial([this.hoverRv], this.hoverMaterial)
    this.hoverRv = null
    this.hoverMaterial = null
  }

  protected copyHoverMaterial(source: Material) {
    this.highlightMaterial.color.copy(
      source['color'] ? source['color'] : new Color(0xffffff)
    )
    this.highlightMaterial.opacity = source.opacity
    this.highlightMaterial.transparent = source.transparent
  }
}
