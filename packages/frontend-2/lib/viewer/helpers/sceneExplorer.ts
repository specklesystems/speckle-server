import type { MaybeNullOrUndefined } from '@speckle/shared'
import type {
  NumericPropertyInfo,
  PropertyInfo,
  SpeckleObject,
  SpeckleReference,
  StringPropertyInfo
} from '@speckle/viewer'
import type { Raw } from 'vue'

export const isStringPropertyInfo = (
  info: MaybeNullOrUndefined<PropertyInfo>
): info is StringPropertyInfo => info?.type === 'string'
export const isNumericPropertyInfo = (
  info: MaybeNullOrUndefined<PropertyInfo>
): info is NumericPropertyInfo => info?.type === 'number'

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

export enum ModelsSubView {
  Main = 'main',
  Versions = 'versions',
  Diff = 'diff'
}

export type ActivePanel =
  | 'none'
  | 'models'
  | 'discussions'
  | 'explorer'
  | 'automate'
  | 'filters'
  | 'devMode'
  | 'savedViews'
