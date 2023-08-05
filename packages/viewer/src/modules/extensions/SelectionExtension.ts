import { IViewer, SelectionEvent, TreeNode, ViewerEvent } from '../..'
import { InputEvent } from '../input/Input'
import SpeckleGhostMaterial from '../materials/SpeckleGhostMaterial'
import SpeckleMesh from '../objects/SpeckleMesh'
import { ExtendedIntersection } from '../objects/SpeckleRaycaster'
import { Extension } from './core-extensions/Extension'
import { ICameraProvider } from './core-extensions/Providers'
import { ObjectLayers } from '../SpeckleRenderer'
import { NodeRenderView } from '../tree/NodeRenderView'
import SpeckleStandardMaterial from '../materials/SpeckleStandardMaterial'
import { DoubleSide } from 'three'
export interface SelectionExtensionOptions {
  selectionColor: number
  showHover: boolean
}

const DefaultSelectionExtensionOptions = {
  selectionColor: 0x047efb,
  showHover: false
}

export class SelectionExtension extends Extension {
  public get inject() {
    return [ICameraProvider.Symbol]
  }

  protected selectionList: Array<TreeNode> = []
  protected selectionId: string
  protected hoverId: string
  protected options: SelectionExtensionOptions = DefaultSelectionExtensionOptions
  protected selectionMaterial: SpeckleStandardMaterial

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
    return this.selectionList.map((v) => v.model.raw)
  }

  public selectObjects(ids: Array<string>, multiSelect = false) {
    const idMap = {}
    for (let k = 0; k < ids.length; k++) {
      idMap[ids[k]] = 1
    }

    if (!multiSelect) {
      this.selectionList = []
    }
    this.viewer.getWorldTree().walk((node) => {
      if (idMap[node.mode.raw.id]) this.selectionList.push(node)
      return true
    })
    this.applySelection()
  }

  protected onObjectClicked(selection: SelectionEvent) {
    if (!selection) {
      this.selectionList = []
      this.applySelection()
      this.selectionId = null
      return
    }
    if (selection.multiple) {
      this.selectionList.push(selection.hits[0].node)
    } else {
      this.selectionList = [selection.hits[0].node]
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
    if (!this.options.showHover) return
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

  protected applySelection(clearCurrent = true) {
    clearCurrent
    // if (clearCurrent) this.viewer.getRenderer().removeDirectFilter(this.selectionId)
    const rvs = []
    for (let k = 0; k < this.selectionList.length; k++) {
      rvs.push(
        ...this.viewer
          .getWorldTree()
          .getRenderTree()
          .getRenderViewsForNode(this.selectionList[k], this.selectionList[k])
      )
    }

    if (rvs.length) this.viewer.getRenderer().setMaterial(rvs, this.selectionMaterial)
  }

  protected applyHover(renderView: NodeRenderView) {
    // this.viewer.getRenderer().removeDirectFilter(this.hoverId)

    if (renderView)
      this.viewer.getRenderer().setMaterial([renderView], this.selectionMaterial)
    this.viewer.requestRender()
  }
}
