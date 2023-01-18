export interface Query {
  id: string
}

export type QueryResult = { [prop: string]: unknown }

export type PointQueryOperation = 'Occlusion' | 'Project' | 'Unproject' | 'Pick'

export interface PointQuery extends Query {
  point: { x: number; y: number; z?: number; w?: number }
  operation: PointQueryOperation
}
