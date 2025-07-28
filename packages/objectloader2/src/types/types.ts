export interface Item {
  baseId: string
  base?: Base
  baseBytes?: Uint8Array
  size?: number
}

export interface Base {
  id: string
  speckle_type: string
  __closure?: Record<string, number>
}

export interface Reference {
  speckle_type: string
  referencedId: string
  __closure?: Record<string, number>
}

export interface DataChunk extends Base {
  data?: Base[]
}
