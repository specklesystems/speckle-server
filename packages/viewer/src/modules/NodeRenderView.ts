import { GeometryData } from './converter/Geometry'
import { SpeckleType } from './converter/GeometryConverter'

export interface RenderMaterial {
  id: string
  color: number
}

export interface DisplayStyle {
  id: string
  color: number
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

  public get renderData() {
    return this._renderData
  }

  public get renderMaterialHash() {
    return this._materialHash
  }

  public get hasGeometry() {
    return this._renderData.geometry && this._renderData.geometry.attributes
  }

  public constructor(data: NodeRenderData) {
    this._renderData = data
    this._materialHash = this.getMaterialHash(data.renderMaterial)

    this._batchId
    this._batchIndexCount
    this._batchIndexStart
  }

  public setBatchData(id: string, start: number, count: number) {
    this._batchId = id
    this._batchIndexStart = start
    this._batchIndexCount = count
  }

  private getMaterialHash(material: RenderMaterial) {
    // FOR NOW
    if (!material) return 0
    return material.color
  }
}
