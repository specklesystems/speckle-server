import { Material } from 'three'
import { NodeRenderView } from '../tree/NodeRenderView'

export enum GeometryType {
  MESH,
  LINE
}

export interface Batch {
  id: string
  renderViews: NodeRenderView[]
  batchMaterial: Material

  setBatchMaterial(material: Material): void
  setDrawRanges(...ranges: BatchUpdateRange[])
  resetDrawRanges()
  buildBatch()
  getRenderView(index: number): NodeRenderView
}

export interface BatchUpdateRange {
  offset: number
  count: number
  material: Material
}
