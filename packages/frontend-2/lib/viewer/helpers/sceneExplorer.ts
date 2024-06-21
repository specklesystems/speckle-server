import type { MaybeNullOrUndefined } from '@speckle/shared'
import {
  type NumericPropertyInfo,
  type PropertyInfo,
  type SpeckleObject,
  type SpeckleReference,
  type StringPropertyInfo
} from '@speckle/viewer'
import type { Raw } from 'vue'

export const isStringPropertyInfo = (
  info: MaybeNullOrUndefined<PropertyInfo>
): info is StringPropertyInfo => info?.type === 'string'
export const isNumericPropertyInfo = (
  info: MaybeNullOrUndefined<PropertyInfo>
): info is NumericPropertyInfo => info?.type === 'number'

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

export type TreeItemComponentModel = {
  rawNode: Raw<ExplorerNode>
}

export type { SpeckleObject, SpeckleReference }
