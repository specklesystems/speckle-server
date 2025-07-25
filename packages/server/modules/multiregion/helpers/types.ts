import type { Nullable, NullableKeysToOptional } from '@speckle/shared'
import type { SetOptional } from 'type-fest'

export type RegionRecord = {
  key: string
  name: string
  description: Nullable<string>
  createdAt: Date
  updatedAt: Date
}

export type InsertableRegionRecord = NullableKeysToOptional<
  SetOptional<RegionRecord, 'createdAt' | 'updatedAt'>
>
