import { Box3 } from 'three'
import { GeometryType } from '../batching/Batch'
import { GeometryData } from '../converter/Geometry'
import { SpeckleType } from '../converter/GeometryConverter'

export interface RenderMaterial {
  id: string
  color: number
  opacity: number
  vertexColors: boolean
}

export interface DisplayStyle {
  id: string
  color: number
  lineWeight: number
}

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

  private readonly _renderData: NodeRenderData
  private _materialHash: number
  private _geometryType: GeometryType

  private _aabb: Box3 = null

  public static readonly NullRenderMaterialHash = this.hashCode(
    GeometryType.MESH.toString()
  )
  public static readonly NullRenderMaterialVertexColorsHash = this.hashCode(
    GeometryType.MESH.toString() + 'vertexColors'
  )
  public static readonly NullDisplayStyleHash = this.hashCode(
    GeometryType.LINE.toString()
  )
  public static readonly NullPointMaterialHash = this.hashCode(
    GeometryType.POINT.toString()
  )
  public static readonly NullPointCloudMaterialHash = this.hashCode(
    GeometryType.POINT_CLOUD.toString()
  )
  public static readonly NullPointCloudVertexColorsMaterialHash = this.hashCode(
    GeometryType.POINT_CLOUD.toString() + 'vertexColors'
  )

  private static hashCode(s: string) {
    let h
    for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
    return h
  }

  public get renderData() {
    return this._renderData
  }

  public get renderMaterialHash() {
    return this._materialHash
  }

  public get hasGeometry() {
    return this._renderData.geometry && this._renderData.geometry.attributes
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

  public constructor(data: NodeRenderData) {
    this._renderData = data
    this._geometryType = this.getGeometryType()
    this._materialHash = this.getMaterialHash()

    this._batchId
    this._batchIndexCount
    this._batchIndexStart
  }

  public setBatchData(id: string, start: number, count: number) {
    this._batchId = id
    this._batchIndexStart = start
    this._batchIndexCount = count
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

      default:
        return GeometryType.LINE
    }
  }

  private renderMaterialToString() {
    return (
      this.renderData.renderMaterial.color.toString() +
      '/' +
      this.renderData.renderMaterial.opacity.toString()
    )
  }

  private displayStyleToString() {
    return (
      this.renderData.displayStyle.color?.toString() +
      '/' +
      this.renderData.displayStyle.lineWeight.toString()
    )
  }

  /** Yeah, this needs a better approach after standardizing renderMaterial vs displayStyle
   *  at the concept level. Currently it's more or less unclear who/when/how should a line/non-line
   *  use either renderMaterial either displayStyle since all speckle types can use both
   */
  private getMaterialHash() {
    const mat =
      this.renderData.renderMaterial &&
      (this.geometryType === GeometryType.MESH ||
        this.geometryType === GeometryType.POINT)
        ? this.renderMaterialToString()
        : this.renderData.displayStyle &&
          this.geometryType !== GeometryType.MESH &&
          this.geometryType !== GeometryType.POINT
        ? this.displayStyleToString()
        : ''
    let geometry = ''
    if (this.renderData.geometry.attributes)
      geometry = this.renderData.geometry.attributes.COLOR ? 'vertexColors' : ''

    const s = this.geometryType.toString() + geometry + mat
    return NodeRenderView.hashCode(s)
  }
}
