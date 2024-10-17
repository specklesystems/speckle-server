import { ObjectChildrenClosureRecord, ObjectRecord } from '@/modules/core/helpers/types'
import { Nullable } from '@speckle/shared'
import { OverrideProperties, SetOptional } from 'type-fest'

export type SpeckleObjectClosureEntry = ObjectChildrenClosureRecord

export type SpeckleObject = ObjectRecord

/**
 * We preemptively serialize a couple of fields (usually knex does it)
 */
export type InsertableSpeckleObject = OverrideProperties<
  SetOptional<SpeckleObject, 'createdAt'>,
  {
    data: string
    totalChildrenCountByDepth: string
  }
>

export type RawSpeckleObject = Record<string, unknown> & {
  id: string
  speckle_type: string
  totalChildrenCount: number
  hash?: string
  __closure: Nullable<Record<string, number>>
}
