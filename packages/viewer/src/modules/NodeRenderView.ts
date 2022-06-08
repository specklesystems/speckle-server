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
  speckleType: SpeckleType
  geometry: GeometryData
  renderMaterial: RenderMaterial
  displayStyle: DisplayStyle
  batchId: string
  batchIndexStart: number
  batchIndexCount: number
}

export class NodeRenderView {
  private readonly _renderData: { [id: string]: NodeRenderData } = {}

  public get renderData() {
    return this._renderData
  }

  public setRenderNode(id: string, data: NodeRenderData) {
    this._renderData[id] = data
  }

  public getRenderNode(id: string) {
    return this._renderData[id]
  }

  public getFirstRenderNode(): NodeRenderData {
    return Object.values(this._renderData)[0]
  }

  public getAllRenderNodes(): NodeRenderData[] {
    return Object.values(this._renderData)
  }
}
