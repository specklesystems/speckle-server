import { ObjectChildrenClosureRecord, ObjectRecord } from '@/modules/core/helpers/types'
import { Nullable, NullableKeysToOptional } from '@speckle/shared'
import { OverrideProperties, SetOptional } from 'type-fest'

export type SpeckleObjectClosureEntry = ObjectChildrenClosureRecord

export type SpeckleObject = ObjectRecord

/**
 * We preemptively serialize a couple of fields (usually knex does it)
 */
export type InsertableSpeckleObject = NullableKeysToOptional<
  OverrideProperties<
    // Both createdAt & speckleType have defaults upon insertion
    SetOptional<SpeckleObject, 'createdAt' | 'speckleType'>,
    {
      data: string
      totalChildrenCountByDepth: Nullable<string>
    }
  >
>

export type RawSpeckleObject = Record<string, unknown> & {
  id?: string
  speckle_type?: string
  totalChildrenCount?: number
  hash?: string
  __closure?: Nullable<Record<string, number>>
}
