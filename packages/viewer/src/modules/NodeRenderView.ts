import { GeometryData } from './converter/Geometry'
import { SpeckleType } from './converter/GeometryConverter'

export interface NodeRenderData {
  speckleType: SpeckleType
  geometry: GeometryData
  batchId: string
  batchIndexStart: number
  batchIndexCount: number
}

export class NodeRenderView {
  private readonly _renderData: { [id: string]: NodeRenderData } = {}

  public get renderData() {
    return this._renderData
  }

  public setData(id: string, data: NodeRenderData) {
    this._renderData[id] = data
  }
}
