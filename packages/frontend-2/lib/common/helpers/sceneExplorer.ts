import { type SpeckleObject, type SpeckleReference } from '@speckle/viewer'

// Note: minor typing hacks for less squiggly lines in the explorer.
// TODO: ask alex re viewer data tree types

export type ExplorerNode = {
  guid?: string
  data?: SpeckleObject
  raw?: SpeckleObject
  atomic?: boolean
  model?: Record<string, unknown> & { id?: string }
  children: ExplorerNode[]
}

export type { SpeckleObject, SpeckleReference }
