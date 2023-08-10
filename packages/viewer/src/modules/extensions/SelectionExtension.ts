import { IViewer, SelectionEvent, TreeNode, ViewerEvent } from '../..'
import { ExtendedIntersection } from '../objects/SpeckleRaycaster'
import { Extension } from './core-extensions/Extension'
import { ICameraProvider } from './core-extensions/Providers'
import { ObjectLayers } from '../SpeckleRenderer'
import { NodeRenderView } from '../tree/NodeRenderView'
import SpeckleStandardMaterial from '../materials/SpeckleStandardMaterial'
import { DoubleSide, Material } from 'three'
import { InputEvent } from '../input/Input'
import SpecklePointMaterial from '../materials/SpecklePointMaterial'
import { GeometryType } from '../batching/Batch'
import SpeckleTextMaterial from '../materials/SpeckleTextMaterial'
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
  protected meshSelectionMaterial: SpeckleStandardMaterial
  protected meshTransparentMaterial: SpeckleStandardMaterial
  protected pointSelectionMaterial: SpecklePointMaterial
  protected pointCloudSelectionMaterial: SpecklePointMaterial
  protected textSelectionMaterial: SpeckleTextMaterial
  protected meshHighlightMaterial: SpeckleStandardMaterial
  protected pointHighlightMaterial: SpecklePointMaterial
  protected pointCloudHighlightMaterial: SpecklePointMaterial
  protected textHighlightMaterial: SpeckleTextMaterial

  public constructor(viewer: IViewer, protected cameraProvider: ICameraProvider) {
    super(viewer)
    this.viewer.on(ViewerEvent.ObjectClicked, this.onObjectClicked.bind(this))
    this.viewer.on(ViewerEvent.ObjectDoubleClicked, this.onObjectDoubleClick.bind(this))
    this.viewer
      .getRenderer()
      .input.on(InputEvent.PointerMove, this.onPointerMove.bind(this))

    this.meshSelectionMaterial = new SpeckleStandardMaterial(
      {
        color: 0x047efb,
        emissive: 0x0,
        roughness: 1,
        metalness: 0,
        side: DoubleSide
      },
      ['USE_RTE']
    )
    this.meshSelectionMaterial.stencilOutline = true
    this.meshSelectionMaterial.color.convertSRGBToLinear()

    this.meshTransparentMaterial = this.meshSelectionMaterial.clone()
    this.meshTransparentMaterial.transparent = true
    this.meshTransparentMaterial.opacity = 0.5

    this.pointSelectionMaterial = new SpecklePointMaterial(
      {
        color: 0x047efb,
        vertexColors: false,
        size: 4,
        sizeAttenuation: false
      },
      ['USE_RTE']
    )
    this.pointSelectionMaterial.color.convertSRGBToLinear()

    this.pointCloudSelectionMaterial = new SpecklePointMaterial(
      {
        color: 0x047efb,
        vertexColors: true,
        size: 2,
        sizeAttenuation: false
      },
      ['USE_RTE']
    )
    this.pointCloudSelectionMaterial.color.convertSRGBToLinear()

    this.textSelectionMaterial = new SpeckleTextMaterial(
      {
        color: 0x047efb,
        opacity: 1,
        side: DoubleSide
      },
      ['USE_RTE']
    )
    this.textSelectionMaterial.toneMapped = false
    ;(this.textSelectionMaterial as SpeckleTextMaterial).color.convertSRGBToLinear()

    this.textSelectionMaterial = (
      this.textSelectionMaterial as SpeckleTextMaterial
    ).getDerivedMaterial()

    this.meshHighlightMaterial = new SpeckleStandardMaterial(
      {
        color: 0xff7377,
        emissive: 0x0,
        roughness: 1,
        metalness: 0,
        side: DoubleSide
      },
      ['USE_RTE']
    )

    this.pointHighlightMaterial = new SpecklePointMaterial(
      {
        color: 0xff7377,
        vertexColors: false,
        size: 4,
        sizeAttenuation: false
      },
      ['USE_RTE']
    )
    this.pointCloudHighlightMaterial = new SpecklePointMaterial(
      {
        color: 0xff7377,
        vertexColors: true,
        size: 2,
        sizeAttenuation: false
      },
      ['USE_RTE']
    )
    this.textHighlightMaterial = new SpeckleTextMaterial(
      {
        color: 0xff7377,
        opacity: 1,
        side: DoubleSide
      },
      ['USE_RTE']
    )
    this.textHighlightMaterial.toneMapped = false
    ;(this.textHighlightMaterial as SpeckleTextMaterial).color.convertSRGBToLinear()

    this.textHighlightMaterial = (
      this.textHighlightMaterial as SpeckleTextMaterial
    ).getDerivedMaterial()
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

    const opaqueMeshes = []
    const transparentMeshes = []
    const points = []
    const pointClouds = []
    const text = []
    for (let k = 0; k < opaqueRvs.length; k++) {
      switch (opaqueRvs[k].geometryType) {
        case GeometryType.MESH:
          opaqueMeshes.push(opaqueRvs[k])
          break
        case GeometryType.LINE:
          opaqueMeshes.push(opaqueRvs[k])
          break
        case GeometryType.POINT:
          points.push(opaqueRvs[k])
          break
        case GeometryType.POINT_CLOUD:
          pointClouds.push(opaqueRvs[k])
          break
        case GeometryType.TEXT:
          text.push(opaqueRvs[k])
      }
    }
    for (let k = 0; k < transparentRvs.length; k++) {
      switch (transparentRvs[k].geometryType) {
        case GeometryType.MESH:
          transparentMeshes.push(transparentRvs[k])
          break
        case GeometryType.LINE:
          transparentMeshes.push(transparentRvs[k])
          break
        case GeometryType.POINT:
          points.push(transparentRvs[k])
          break
        case GeometryType.POINT_CLOUD:
          pointClouds.push(transparentRvs[k])
          break
        case GeometryType.TEXT:
          text.push(transparentRvs[k])
      }
    }

    this.viewer.getRenderer().setMaterial(opaqueMeshes, this.meshSelectionMaterial)
    this.viewer.getRenderer().setMaterial(points, this.pointSelectionMaterial)
    this.viewer.getRenderer().setMaterial(pointClouds, this.pointCloudSelectionMaterial)
    this.viewer.getRenderer().setMaterial(text, this.textSelectionMaterial)
    this.viewer
      .getRenderer()
      .setMaterial(transparentMeshes, this.meshTransparentMaterial)
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
    this.copyHoverMaterial(this.hoverMaterial)
    switch (renderView.geometryType) {
      case GeometryType.MESH:
        this.viewer.getRenderer().setMaterial([renderView], this.meshHighlightMaterial)
        break
      case GeometryType.LINE:
        this.viewer.getRenderer().setMaterial([renderView], this.meshHighlightMaterial)
        break
      case GeometryType.POINT:
        this.viewer.getRenderer().setMaterial([renderView], this.pointHighlightMaterial)
        break
      case GeometryType.POINT_CLOUD:
        this.viewer
          .getRenderer()
          .setMaterial([renderView], this.pointCloudHighlightMaterial)
        break
      case GeometryType.TEXT:
        this.viewer.getRenderer().setMaterial([renderView], this.textHighlightMaterial)
        break
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
    this.meshHighlightMaterial.opacity = source.opacity
    this.meshHighlightMaterial.transparent = source.transparent
  }
}
