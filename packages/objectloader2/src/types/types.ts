export interface Item {
  baseId: string
  base?: Base
  size?: number
}

export interface Base {
  id: string
  speckle_type: string
  __closure?: Record<string, number>
  properties?: Record<string, object | string | number | boolean | undefined>
}

export interface Reference {
  speckle_type: string
  referencedId: string
  __closure?: Record<string, number>
}

export interface DataChunk extends Base {
  data?: Base[]
}

export interface SearchQuery {
  operator: 'AND' | 'OR'
  queries: Array<{
    key: string
    value: string
    exact?: boolean
  }>
}

export interface SearchResult {
  key: string
  value: string
  objectId: string
}
