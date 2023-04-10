export interface Query {
  id?: string // id will be used later on if we develop the queries further
  operation: string
}

export type QueryResult = PointQueryResult | IntersectionQueryResult

export type QueryOperation = 'Project' | 'Unproject' | 'Occlusion' | 'Pick'

export interface PointQuery extends Query {
  point: { x: number; y: number; z?: number; w?: number }
  operation: 'Project' | 'Unproject'
}

export interface IntersectionQuery extends Query {
  point: { x: number; y: number; z?: number; w?: number }
  tolerance?: number
  operation: 'Occlusion' | 'Pick'
}

export interface PointQueryResult {
  x: number
  y: number
  z?: number
  w?: number
}

export interface IntersectionQueryResult {
  objects: Array<{
    guid: string
    object?: Record<string, unknown>
    point: { x: number; y: number; z: number }
  }> | null
}

export type QueryArgsResultMap = {
  Project: PointQueryResult
  Unproject: PointQueryResult
  Occlusion: IntersectionQueryResult
  Pick: IntersectionQueryResult
} & { [key: string]: unknown }
