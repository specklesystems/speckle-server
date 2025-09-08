export interface Item {
  baseId: string
  base?: Base
  size?: number
}

export interface Base {
  id: string
  speckle_type: string
  __closure?: Record<string, number>
  [x: string]: unknown
}

export interface Reference {
  speckle_type: string
  referencedId: string
  __closure?: Record<string, number>
}

export interface DataChunk extends Base {
  data?: Base[]
}
