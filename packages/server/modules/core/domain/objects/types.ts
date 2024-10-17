import { ObjectChildrenClosureRecord, ObjectRecord } from '@/modules/core/helpers/types'
import { Nullable } from '@speckle/shared'

export type SpeckleObjectClosureEntry = ObjectChildrenClosureRecord

export type SpeckleObject = ObjectRecord

export type RawSpeckleObject = Record<string, unknown> & {
  id: string
  speckle_type: string
  totalChildrenCount: number
  hash?: string
  __closure: Nullable<Record<string, number>>
}
