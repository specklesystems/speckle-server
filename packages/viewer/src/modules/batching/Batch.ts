import { Box3, Material, Object3D, WebGLRenderer } from 'three'
import { FilterMaterialOptions } from '../materials/Materials'
import { NodeRenderView } from '../tree/NodeRenderView'
import { DrawGroup } from './InstancedMeshBatch'

export enum GeometryType {
  MESH,
  LINE,
  POINT,
  POINT_CLOUD,
  TEXT
}

/** TO DO: Unify point and mesh batch implementations */
export interface Batch {
  id: string
  subtreeId: string
  renderViews: NodeRenderView[]
  batchMaterial: Material
  renderObject: Object3D
  geometryType: GeometryType

  get bounds(): Box3
  get drawCalls(): number
  get minDrawCalls(): number
  get materials(): Material[]
  get groups(): DrawGroup[]
  get triCount(): number
  get vertCount(): number

  getCount(): number
  setBatchMaterial(material: Material): void
  setBatchBuffers(...range: BatchUpdateRange[]): void
  setVisibleRange(...range: BatchUpdateRange[])
  getVisibleRange(): BatchUpdateRange
  setDrawRanges(...ranges: BatchUpdateRange[])
  resetDrawRanges()
  buildBatch()
  getRenderView(index: number): NodeRenderView
  getMaterialAtIndex(index: number): Material
  getMaterial(rv: NodeRenderView): Material
  getOpaque(): BatchUpdateRange
  getTransparent(): BatchUpdateRange
  getStencil(): BatchUpdateRange
  onUpdate(deltaTime: number)
  onRender(renderer: WebGLRenderer)
  purge()
}

export interface BatchUpdateRange {
  offset: number
  count: number
  material?: Material
  materialOptions?: FilterMaterialOptions
}

export const NoneBatchUpdateRange = {
  offset: 0,
  count: 0
} as BatchUpdateRange

export const AllBatchUpdateRange = {
  offset: 0,
  count: Infinity
} as BatchUpdateRange
