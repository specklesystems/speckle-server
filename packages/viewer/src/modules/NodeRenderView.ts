import { GeometryType } from './Batch'
import { GeometryData } from './converter/Geometry'
import { SpeckleType } from './converter/GeometryConverter'

export interface RenderMaterial {
  id: string
  color: number
}

export interface DisplayStyle {
  id: string
  color: number
  lineWeigth: number
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

  public static readonly NullRenderMaterialHash = this.hashCode(
    GeometryType.MESH.toString()
  )
  public static readonly NullDisplayStyleHash = this.hashCode(
    GeometryType.LINE.toString()
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

  public get geometryType() {
    return this._geometryType
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

  public getGeometryType(): GeometryType {
    switch (this._renderData.speckleType) {
      case SpeckleType.Mesh:
        return GeometryType.MESH

      default:
        return GeometryType.LINE
    }
  }

  private getMaterialHash() {
    const mat = this.renderData.renderMaterial
      ? this.renderData.renderMaterial.color.toString()
      : this.renderData.displayStyle
      ? this.renderData.displayStyle.color.toString()
      : ''
    const s = this.geometryType.toString() + mat
    return NodeRenderView.hashCode(s)
  }
}
