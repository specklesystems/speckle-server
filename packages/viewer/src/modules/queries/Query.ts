export interface Query {
  id?: string // id will be used later on if we develop the queries further
  operation: QueryOperation
}

export type QueryResult = PointQueryResult | IntersectionQueryResult

export type QueryOperation = 'Project' | 'Unproject' | 'Occlusion' | 'Pick'

export interface PointQuery extends Query {
  point: { x: number; y: number; z?: number; w?: number }
}

export interface IntersectionQuery extends PointQuery {
  tolerance?: number
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
    object: Record<string, unknown>
    point: { x: number; y: number; z: number }
  }> | null
}
