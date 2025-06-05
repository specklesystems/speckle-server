export enum RingBufferState {
  READY = 0,
  FULL = 1,
  EMPTY = 2,
  OVERFLOW = 3
}

export interface Item {
  baseId: string
  base: Base
  size?: number
}

export interface Base {
  id: string
  speckle_type: string
  __closure?: Record<string, number>
}
