import { Optional } from '@speckle/shared'
import { buildTableHelper, knex, Objects } from '@/modules/core/dbSchema'
import { ObjectChildrenClosureRecord, ObjectRecord } from '@/modules/core/helpers/types'
import {
  BatchedSelectOptions,
  executeBatchedSelect
} from '@/modules/shared/helpers/dbHelper'
import { Knex } from 'knex'
import {
  GetBatchedStreamObjects,
  GetFormattedObject,
  GetObject,
  GetObjectChildrenStream,
  GetStreamObjects,
  StoreClosuresIfNotFound,
  StoreObjects,
  StoreObjectsIfNotFound,
  StoreSingleObjectIfNotFound
} from '@/modules/core/domain/objects/operations'
import { SpeckleObject } from '@/modules/core/domain/objects/types'
import { SetOptional } from 'type-fest'

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

export const getFormattedObjectFactory =
  (deps: { db: Knex }): GetFormattedObject =>
  async ({ streamId, objectId }) => {
    const res = await tables
      .objects(deps.db)
      .where({ streamId, id: objectId })
      .select('*')
      .first()
    if (!res) return null

    // TODO: Why tho? A lot if not most of places already just use getObjectFactory,
    const finalRes: SetOptional<typeof res, 'streamId'> = res
    if (finalRes.data) finalRes.data.totalChildrenCount = res.totalChildrenCount // move this back
    delete finalRes.streamId // backwards compatibility

    return finalRes
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

export const storeObjectsIfNotFoundFactory =
  (deps: { db: Knex }): StoreObjectsIfNotFound =>
  async (batch) => {
    await tables
      .objects(deps.db)
      .insert(
        // knex is bothered by string being inserted into jsonb, which is actually fine
        batch as SpeckleObject[]
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

export const getObjectChildrenStreamFactory =
  (deps: { db: Knex }): GetObjectChildrenStream =>
  async ({ streamId, objectId }) => {
    const q = deps.db.with(
      'object_children_closure',
      knex.raw(
        `SELECT objects.id as parent, d.key as child, d.value as mindepth, ? as "streamId"
        FROM objects
        JOIN jsonb_each_text(objects.data->'__closure') d ON true
        where objects.id = ?`,
        [streamId, objectId]
      )
    )
    q.select('id')
    q.select(knex.raw('data::text as "dataText"'))
    q.from('object_children_closure')

    q.rightJoin('objects', function () {
      this.on('objects.streamId', '=', 'object_children_closure.streamId').andOn(
        'objects.id',
        '=',
        'object_children_closure.child'
      )
    })
      .where(
        knex.raw('object_children_closure."streamId" = ? AND parent = ?', [
          streamId,
          objectId
        ])
      )
      .orderBy('objects.id')
    return q.stream({ highWaterMark: 500 })
  }
