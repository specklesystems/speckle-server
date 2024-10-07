import { Optional } from '@speckle/shared'
import { Objects } from '@/modules/core/dbSchema'
import { ObjectRecord } from '@/modules/core/helpers/types'
import {
  BatchedSelectOptions,
  executeBatchedSelect
} from '@/modules/shared/helpers/dbHelper'
import { Knex } from 'knex'
import { GetStreamObjects } from '@/modules/core/domain/objects/operations'

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

export async function getObject(
  objectId: string,
  streamId: string
): Promise<Optional<ObjectRecord>> {
  return await Objects.knex<ObjectRecord[]>()
    .where(Objects.col.id, objectId)
    .andWhere(Objects.col.streamId, streamId)
    .first()
}

export function getBatchedStreamObjects(
  streamId: string,
  options?: Partial<BatchedSelectOptions>
) {
  const baseQuery = Objects.knex<ObjectRecord[]>()
    .where(Objects.col.streamId, streamId)
    .orderBy(Objects.col.id)

  return executeBatchedSelect(baseQuery, options)
}

export async function insertObjects(
  objects: ObjectRecord[],
  options?: Partial<{ trx: Knex.Transaction }>
) {
  const q = Objects.knex().insert(objects)
  if (options?.trx) q.transacting(options.trx)
  return await q
}
