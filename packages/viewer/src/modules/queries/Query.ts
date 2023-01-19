export interface Query {
  id: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryResult = { [prop: string]: any }

export type PointQueryOperation = 'Occlusion' | 'Project' | 'Unproject' | 'Pick'

export interface PointQuery extends Query {
  point: { x: number; y: number; z?: number; w?: number }
  tolerance?: number
  operation: PointQueryOperation
}
