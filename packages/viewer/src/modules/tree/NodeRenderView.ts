import { Box3 } from 'three'
import { GeometryType } from '../batching/Batch'
import { GeometryData } from '../converter/Geometry'
import Materials, { DisplayStyle, RenderMaterial } from '../materials/Materials'
import { SpeckleType } from '../loaders/GeometryConverter'

export interface NodeRenderData {
  id: string
  speckleType: SpeckleType
  geometry: GeometryData
  renderMaterial: RenderMaterial
  displayStyle: DisplayStyle
}

export class NodeRenderView {
  private _batchId: string
  private _batchIndexStart: number
  private _batchIndexCount: number
  private _batchVertexStart: number
  private _batchVertexEnd: number

  private readonly _renderData: NodeRenderData
  private _materialHash: number
  private _geometryType: GeometryType

  private _aabb: Box3 = null

  public get renderData() {
    return this._renderData
  }

  public get renderMaterialHash() {
    return this._materialHash
  }

  public get hasGeometry() {
    return this._renderData.geometry && this._renderData.geometry.attributes
  }

  public get hasMetadata() {
    return this._renderData.geometry && this._renderData.geometry.metaData
  }

  public get speckleType() {
    return this._renderData.speckleType
  }

  public get geometryType() {
    return this._geometryType
  }

  public get batchStart() {
    return this._batchIndexStart
  }

  public get batchEnd() {
    return this._batchIndexStart + this._batchIndexCount
  }

  public get batchCount() {
    return this._batchIndexCount
  }

  public get batchId() {
    return this._batchId
  }

  public get aabb() {
    return this._aabb
  }

  public get transparent() {
    return (
      this._renderData.renderMaterial && this._renderData.renderMaterial.opacity < 1
    )
  }

  public get vertStart() {
    return this._batchVertexStart
  }

  public get vertEnd() {
    return this._batchVertexEnd
  }

  public get needsSegmentConversion() {
    return (
      this._renderData.speckleType === SpeckleType.Curve ||
      this._renderData.speckleType === SpeckleType.Polyline ||
      this._renderData.speckleType === SpeckleType.Polycurve ||
      this.renderData.speckleType === SpeckleType.Arc ||
      this.renderData.speckleType === SpeckleType.Circle ||
      this.renderData.speckleType === SpeckleType.Ellipse
    )
  }

  public get validGeometry() {
    return (
      this._renderData.geometry.attributes &&
      this._renderData.geometry.attributes.POSITION &&
      this._renderData.geometry.attributes.POSITION.length > 0 &&
      (this._geometryType === GeometryType.MESH
        ? this._renderData.geometry.attributes.INDEX &&
          this._renderData.geometry.attributes.INDEX.length > 0
        : true)
    )
  }

  public constructor(data: NodeRenderData) {
    this._renderData = data
    this._geometryType = this.getGeometryType()
    this._materialHash = Materials.getMaterialHash(this)

    this._batchId
    this._batchIndexCount
    this._batchIndexStart
    this._batchVertexStart
    this._batchVertexEnd
  }

  public setBatchData(
    id: string,
    start: number,
    count: number,
    vertStart?: number,
    vertEnd?: number
  ) {
    this._batchId = id
    this._batchIndexStart = start
    this._batchIndexCount = count
    if (vertStart !== undefined) this._batchVertexStart = vertStart
    if (vertEnd !== undefined) this._batchVertexEnd = vertEnd
  }

  public computeAABB() {
    this._aabb = new Box3().setFromArray(this._renderData.geometry.attributes.POSITION)
  }

  public getGeometryType(): GeometryType {
    switch (this._renderData.speckleType) {
      case SpeckleType.Mesh:
        return GeometryType.MESH
      case SpeckleType.Brep:
        return GeometryType.MESH
      case SpeckleType.Point:
        return GeometryType.POINT
      case SpeckleType.Pointcloud:
        return GeometryType.POINT_CLOUD
      case SpeckleType.Text:
        return GeometryType.TEXT

      default:
        return GeometryType.LINE
    }
  }

  public disposeGeometry() {
    for (const attr in this._renderData.geometry.attributes) {
      this._renderData.geometry.attributes[attr] = []
    }
  }
}
