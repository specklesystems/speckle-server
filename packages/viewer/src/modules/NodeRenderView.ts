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
  batchId: string
  batchIndexStart: number
  batchIndexCount: number
}

export class NodeRenderView {
  private readonly _renderData: NodeRenderData
  private _materialHash: number

  public get renderData() {
    return this._renderData
  }

  public get renderMaterialHash() {
    return this._materialHash
  }

  public constructor(data: NodeRenderData) {
    this._renderData = data
    this._materialHash = this.getMaterialHash(data.renderMaterial)
  }

  private getMaterialHash(material: RenderMaterial) {
    // FOR NOW
    if (!material) return 0
    return material.color
  }
}
