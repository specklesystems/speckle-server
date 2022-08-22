import { Material, Object3D, WebGLRenderer } from 'three'
import { MaterialOptions } from '../materials/Materials'
import { NodeRenderView } from '../tree/NodeRenderView'

export enum GeometryType {
  MESH,
  LINE,
  POINT,
  POINT_CLOUD
}

export interface Batch {
  id: string
  subtreeId: string
  renderViews: NodeRenderView[]
  batchMaterial: Material
  renderObject: Object3D
  geometryType: GeometryType

  getCount(): number
  setBatchMaterial(material: Material): void
  setVisibleRange(...range: BatchUpdateRange[])
  setDrawRanges(...ranges: BatchUpdateRange[])
  autoFillDrawRanges()
  resetDrawRanges()
  buildBatch()
  getRenderView(index: number): NodeRenderView
  onUpdate(deltaTime: number)
  onRender(renderer: WebGLRenderer)
  purge()
}

export interface BatchUpdateRange {
  offset: number
  count: number
  material?: Material
  materialOptions?: MaterialOptions
}

export const HideAllBatchUpdateRange = {
  offset: 0,
  count: 0
} as BatchUpdateRange
