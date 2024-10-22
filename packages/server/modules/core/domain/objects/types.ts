import { ObjectChildrenClosureRecord, ObjectRecord } from '@/modules/core/helpers/types'
import { Nullable, NullableKeysToOptional } from '@speckle/shared'
import { OverrideProperties, SetOptional } from 'type-fest'

export type SpeckleObjectClosureEntry = ObjectChildrenClosureRecord

export type SpeckleObject = ObjectRecord

/**
 * TODO: The types are a bit too lax right now, we don't really want to allow missing id, speckle_type, __closure props, so we should revisit
 * the code in the future and make the necessary changes to ensure that these props are always present
 */

export type InsertableSpeckleObject = NullableKeysToOptional<
  // data & totalChildrenCountByDepth are inserted as strings, which differs from the original type (because of preemptive serialization)
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
