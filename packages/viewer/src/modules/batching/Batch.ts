import { Material, Object3D } from 'three'
import { NodeRenderView } from '../tree/NodeRenderView'

export enum GeometryType {
  MESH,
  LINE,
  POINT,
  POINT_CLOUD
}

export interface Batch {
  id: string
  renderViews: NodeRenderView[]
  batchMaterial: Material
  renderObject: Object3D

  getCount(): number
  setBatchMaterial(material: Material): void
  setVisibleRange(...range: BatchUpdateRange[])
  setDrawRanges(...ranges: BatchUpdateRange[])
  autoFillDrawRanges()
  resetDrawRanges()
  buildBatch()
  getRenderView(index: number): NodeRenderView
  purge()
}

export interface BatchUpdateRange {
  offset: number
  count: number
  material?: Material
}

export const HideAllBatchUpdateRange = {
  offset: 0,
  count: 0
} as BatchUpdateRange
