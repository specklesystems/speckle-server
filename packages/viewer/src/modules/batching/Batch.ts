import { Box3, Material, Object3D, WebGLRenderer } from 'three'
import { type FilterMaterialOptions } from '../materials/Materials.js'
import { NodeRenderView } from '../tree/NodeRenderView.js'

export enum GeometryType {
  MESH,
  LINE,
  POINT,
  POINT_CLOUD,
  TEXT
}

export interface DrawGroup {
  start: number
  count: number
  materialIndex: number
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
  get pointCount(): number
  get lineCount(): number
  get vertCount(): number

  getCount(): number
  setBatchMaterial(material: Material): void
  setBatchBuffers(range: BatchUpdateRange[]): void
  setVisibleRange(range: BatchUpdateRange[]): void
  getVisibleRange(): BatchUpdateRange
  setDrawRanges(ranges: BatchUpdateRange[]): void
  resetDrawRanges(): void
  buildBatch(): Promise<void>
  getRenderView(index: number): NodeRenderView | null
  getMaterialAtIndex(index: number): Material | null
  getMaterial(rv: NodeRenderView): Material | null
  getOpaque(): BatchUpdateRange
  getTransparent(): BatchUpdateRange
  getStencil(): BatchUpdateRange
  getDepth(): BatchUpdateRange
  onUpdate(deltaTime?: number): void
  onRender?(renderer: WebGLRenderer): void
  purge(): void
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

export const INSTANCE_TRANSFORM_BUFFER_STRIDE = 16
export const INSTANCE_GRADIENT_BUFFER_STRIDE = 1
