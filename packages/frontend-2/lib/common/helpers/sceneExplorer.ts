export type ExplorerNode = {
  guid?: string
  data?: SpeckleObject
  atomic?: boolean
  children: ExplorerNode[]
}

export type SpeckleReference = {
  referencedId: string
}

export interface SpeckleObject {
  id?: string
  elements?: SpeckleReference[]
  children?: SpeckleObject[]
}
