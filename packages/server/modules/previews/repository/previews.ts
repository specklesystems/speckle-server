import { buildTableHelper } from '@/modules/core/dbSchema'
import {
  GetObjectPreviewInfo,
  GetPreviewImage,
  StoreObjectPreview,
  StorePreview,
  UpsertObjectPreview
} from '@/modules/previews/domain/operations'
import {
  ObjectPreview as ObjectPreviewRecord,
  Preview
} from '@/modules/previews/domain/types'
import { Knex } from 'knex'
import { SetOptional } from 'type-fest'
import { PreviewStatus } from '@/modules/previews/domain/consts'

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

/**
 * @throws {Error} if the preview already exists
 */
export const storeObjectPreviewFactory =
  ({ db }: { db: Knex }): StoreObjectPreview =>
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
        previewStatus: PreviewStatus.PENDING
      }
    const sqlQuery = tables.objectPreview(db).insert(insertionObject)

    await sqlQuery
  }

export const storePreviewFactory =
  ({ db }: { db: Knex }): StorePreview =>
  async ({ preview }) => {
    await tables.previews(db).insert(preview).onConflict().ignore()
  }

export const upsertObjectPreviewFactory =
  ({ db }: { db: Knex }): UpsertObjectPreview =>
  async ({ objectPreview }) => {
    await tables
      .objectPreview(db)
      .insert(objectPreview)
      .onConflict(['streamId', 'objectId'])
      .merge()
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
