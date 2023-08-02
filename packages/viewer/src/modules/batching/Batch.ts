import { Box3, Material, Object3D, WebGLRenderer } from 'three'
import { MaterialOptions } from '../materials/Materials'
import { NodeRenderView } from '../tree/NodeRenderView'

export enum GeometryType {
  MESH,
  LINE,
  POINT,
  POINT_CLOUD,
  TEXT
}

export interface Batch {
  id: string
  subtreeId: string
  renderViews: NodeRenderView[]
  batchMaterial: Material
  renderObject: Object3D
  geometryType: GeometryType

  get bounds(): Box3

  getCount(): number
  setBatchMaterial(material: Material): void
  setVisibleRange(...range: BatchUpdateRange[])
  getVisibleRange(): BatchUpdateRange
  setDrawRanges(...ranges: BatchUpdateRange[])
  insertDrawRanges(...ranges: BatchUpdateRange[])
  removeDrawRanges(id: string)
  autoFillDrawRanges()
  resetDrawRanges()
  buildBatch()
  getRenderView(index: number): NodeRenderView
  getMaterialAtIndex(index: number): Material
  onUpdate(deltaTime: number)
  onRender(renderer: WebGLRenderer)
  purge()
}

export interface BatchUpdateRange {
  offset: number
  count: number
  material?: Material
  materialOptions?: MaterialOptions
  id?: string
}

export const HideAllBatchUpdateRange = {
  offset: 0,
  count: 0
} as BatchUpdateRange

export const AllBatchUpdateRange = {
  offset: 0,
  count: Infinity
} as BatchUpdateRange
