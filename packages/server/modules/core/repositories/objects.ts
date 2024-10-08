import { Optional } from '@speckle/shared'
import { Objects } from '@/modules/core/dbSchema'
import { ObjectRecord } from '@/modules/core/helpers/types'
import {
  BatchedSelectOptions,
  executeBatchedSelect
} from '@/modules/shared/helpers/dbHelper'
import { Knex } from 'knex'
import {
  GetBatchedStreamObjects,
  GetObject,
  GetStreamObjects,
  StoreObjects
} from '@/modules/core/domain/objects/operations'

const tables = {
  objects: (db: Knex) => db<ObjectRecord>(Objects.name)
}

export const getStreamObjectsFactory =
  (deps: { db: Knex }): GetStreamObjects =>
  async (streamId: string, objectIds: string[]): Promise<ObjectRecord[]> => {
    if (!objectIds?.length) return []

    const q = tables
      .objects(deps.db)
      .where(Objects.col.streamId, streamId)
      .whereIn(Objects.col.id, objectIds)

    return await q
  }

export const getObjectFactory =
  (deps: { db: Knex }): GetObject =>
  async (objectId: string, streamId: string): Promise<Optional<ObjectRecord>> => {
    return await tables
      .objects(deps.db)
      .where(Objects.col.id, objectId)
      .andWhere(Objects.col.streamId, streamId)
      .first()
  }

export const getBatchedStreamObjectsFactory =
  (deps: { db: Knex }): GetBatchedStreamObjects =>
  (streamId: string, options?: Partial<BatchedSelectOptions>) => {
    const baseQuery = tables
      .objects(deps.db)
      .select<ObjectRecord[]>('*')
      .where(Objects.col.streamId, streamId)
      .orderBy(Objects.col.id)

    return executeBatchedSelect(baseQuery, options)
  }

export const insertObjectsFactory =
  (deps: { db: Knex }): StoreObjects =>
  async (objects: ObjectRecord[], options?: Partial<{ trx: Knex.Transaction }>) => {
    const q = tables.objects(deps.db).insert(objects)
    if (options?.trx) q.transacting(options.trx)
    return await q
  }
