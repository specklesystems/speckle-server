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

  public get renderData() {
    return this._renderData
  }

  public constructor(data: NodeRenderData) {
    this._renderData = data
  }
}
