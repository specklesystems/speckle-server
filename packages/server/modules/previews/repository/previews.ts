/* istanbul ignore file */
import { buildTableHelper } from '@/modules/core/dbSchema'
import {
  CreateObjectPreview,
  GetObjectPreviewInfo,
  GetPreviewImage
} from '@/modules/previews/domain/operations'
import {
  ObjectPreview as ObjectPreviewRecord,
  Preview
} from '@/modules/previews/domain/types'
import { Knex } from 'knex'
import { SetOptional } from 'type-fest'

const ObjectPreview = buildTableHelper('object_preview', [
  'streamId',
  'objectId',
  'previewStatus',
  'priority',
  'lastUpdate',
  'preview'
])
const Previews = buildTableHelper('previews', ['id', 'data'])

const tables = {
  objectPreview: (db: Knex) => db<ObjectPreviewRecord>(ObjectPreview.name),
  previews: (db: Knex) => db<Preview>(Previews.name)
}

export const getObjectPreviewInfoFactory =
  (deps: { db: Knex }): GetObjectPreviewInfo =>
  async ({ streamId, objectId }: { streamId: string; objectId: string }) => {
    return await tables
      .objectPreview(deps.db)
      .select('*')
      .where({ streamId, objectId })
      .first()
  }

export const createObjectPreviewFactory =
  ({ db }: { db: Knex }): CreateObjectPreview =>
  async ({
    streamId,
    objectId,
    priority
  }: Pick<ObjectPreviewRecord, 'streamId' | 'objectId' | 'priority'>) => {
    const insertionObject: SetOptional<ObjectPreviewRecord, 'lastUpdate' | 'preview'> =
      {
        streamId,
        objectId,
        priority,
        previewStatus: 0
      }
    const sqlQuery =
      tables.objectPreview(db).insert(insertionObject).toString() +
      ' on conflict do nothing'

    await db.raw(sqlQuery)
  }

export const getPreviewImageFactory =
  (deps: { db: Knex }): GetPreviewImage =>
  async ({ previewId }: { previewId: string }) => {
    const previewRow = await tables
      .previews(deps.db)
      .where({ id: previewId })
      .first()
      .select('*')
    if (!previewRow) {
      return null
    }
    return previewRow.data
  }
