import { SpeckleObject } from '@/modules/core/domain/objects/types'
import { BatchedSelectOptions } from '@/modules/shared/helpers/dbHelper'
import { Optional } from '@speckle/shared'
import { Knex } from 'knex'

export type GetStreamObjects = (
  streamId: string,
  objectIds: string[]
) => Promise<SpeckleObject[]>

export type GetObject = (
  objectId: string,
  streamId: string
) => Promise<Optional<SpeckleObject>>

export type GetBatchedStreamObjects = (
  streamId: string,
  options?: Partial<BatchedSelectOptions>
) => AsyncGenerator<SpeckleObject[], void, unknown>

export type StoreObjects = (
  objects: SpeckleObject[],
  options?: Partial<{
    trx: Knex.Transaction
  }>
) => Promise<number[]>
