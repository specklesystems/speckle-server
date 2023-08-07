import { IViewer, SelectionEvent, TreeNode, ViewerEvent } from '../..'
import SpeckleGhostMaterial from '../materials/SpeckleGhostMaterial'
import SpeckleMesh from '../objects/SpeckleMesh'
import { ExtendedIntersection } from '../objects/SpeckleRaycaster'
import { Extension } from './core-extensions/Extension'
import { ICameraProvider } from './core-extensions/Providers'
import { ObjectLayers } from '../SpeckleRenderer'
import { NodeRenderView } from '../tree/NodeRenderView'
import SpeckleStandardMaterial from '../materials/SpeckleStandardMaterial'
import { DoubleSide, Material } from 'three'
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

  protected selectedNodes: Array<TreeNode> = []
  protected selectionRvs: { [id: string]: NodeRenderView } = {}
  protected selectionMaterials: { [id: string]: Material } = {}
  protected hoverId: string
  protected options: SelectionExtensionOptions = DefaultSelectionExtensionOptions
  protected selectionMaterial: SpeckleStandardMaterial

  public constructor(viewer: IViewer, protected cameraProvider: ICameraProvider) {
    super(viewer)
    this.viewer.on(ViewerEvent.ObjectClicked, this.onObjectClicked.bind(this))
    this.viewer.on(ViewerEvent.ObjectDoubleClicked, this.onObjectDoubleClick.bind(this))
    // this.viewer
    //   .getRenderer()
    //   .input.on(InputEvent.PointerMove, this.onPointerMove.bind(this))

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
    // return this.selectionList.map((v) => v.model.raw)
  }

  public selectObjects(ids: Array<string>, multiSelect = false) {
    multiSelect
    // const idMap = {}
    // for (let k = 0; k < ids.length; k++) {
    //   idMap[ids[k]] = 1
    // }
    // if (!multiSelect) {
    //   this.selectionList = []
    // }
    // this.viewer.getWorldTree().walk((node) => {
    //   if (idMap[node.mode.raw.id]) this.selectionList.push(node)
    //   return true
    // })
    // this.applySelection()
  }

  protected onObjectClicked(selection: SelectionEvent) {
    if (!selection) {
      this.removeSelection()
      return
    }
    // console.log(selection.hits[0].node.children[0].model.id)
    // console.log(selection.hits[0].node.children[0].model.renderView.batchStart)
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

    this.viewer
      .getRenderer()
      .setMaterial(
        Object.values(Object.values(this.selectionRvs)),
        this.selectionMaterial
      )
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
    // this.viewer.getRenderer().removeDirectFilter(this.hoverId)

    if (renderView)
      this.viewer.getRenderer().setMaterial([renderView], this.selectionMaterial)
    this.viewer.requestRender()
  }
}
