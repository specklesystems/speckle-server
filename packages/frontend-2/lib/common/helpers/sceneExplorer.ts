// Note: minor typing hacks for less squiggly lines in the explorer.
// TODO: ask alex re viewer data tree types

export type ExplorerNode = {
  guid?: string
  data?: SpeckleObject
  raw?: SpeckleObject
  atomic?: boolean
  model?: Record<string, unknown>
  children: ExplorerNode[]
}

export type SpeckleReference = {
  referencedId: string
}

export interface SpeckleObject {
  id?: string
  elements?: SpeckleReference[]
  children?: SpeckleObject[] | SpeckleReference[]
  name?: string
  speckle_type?: string
  [key: string]: unknown
}
