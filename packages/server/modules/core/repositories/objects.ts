import { Optional } from '@speckle/shared'
import { buildTableHelper, Objects } from '@/modules/core/dbSchema'
import { ObjectChildrenClosureRecord, ObjectRecord } from '@/modules/core/helpers/types'
import {
  BatchedSelectOptions,
  executeBatchedSelect
} from '@/modules/shared/helpers/dbHelper'
import { Knex } from 'knex'
import {
  GetBatchedStreamObjects,
  GetObject,
  GetStreamObjects,
  StoreClosuresIfNotFound,
  StoreObjects,
  StoreSingleObjectIfNotFound
} from '@/modules/core/domain/objects/operations'
import { SpeckleObject } from '@/modules/core/domain/objects/types'

const ObjectChildrenClosure = buildTableHelper('object_children_closure', [
  'parent',
  'child',
  'minDepth',
  'streamId'
])

const tables = {
  objects: (db: Knex) => db<ObjectRecord>(Objects.name),
  objectChildrenClosure: (db: Knex) =>
    db<ObjectChildrenClosureRecord>(ObjectChildrenClosure.name)
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

export const storeSingleObjectIfNotFoundFactory =
  (deps: { db: Knex }): StoreSingleObjectIfNotFound =>
  async (insertionObject) => {
    await tables
      .objects(deps.db)
      .insert(
        // knex is bothered by string being inserted into jsonb, which is actually fine
        insertionObject as SpeckleObject
      )
      .onConflict()
      .ignore()
  }

export const storeClosuresIfNotFoundFactory =
  (deps: { db: Knex }): StoreClosuresIfNotFound =>
  async (closuresBatch) => {
    await tables
      .objectChildrenClosure(deps.db)
      .insert(closuresBatch)
      .onConflict()
      .ignore()
  }
