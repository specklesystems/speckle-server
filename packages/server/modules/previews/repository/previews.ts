import { buildTableHelper } from '@/modules/core/dbSchema'
import {
  GetObjectPreviewInfo,
  GetPaginatedObjectPreviewsPage,
  GetPaginatedObjectPreviewsTotalCount,
  GetPreviewImage,
  PaginatedObjectPreviewsParams,
  StoreObjectPreview,
  StorePreview,
  UpdateObjectPreview
} from '@/modules/previews/domain/operations'
import {
  ObjectPreview as ObjectPreviewRecord,
  Preview
} from '@/modules/previews/domain/types'
import { Knex } from 'knex'
import { SetOptional } from 'type-fest'
import { PreviewStatus } from '@/modules/previews/domain/consts'
import { decodeCursor, encodeCursor } from '@/modules/shared/helpers/dbHelper'

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

export const getPaginatedObjectsPreviewsBaseQueryFactory =
  (deps: { db: Knex }) =>
  (params: Omit<PaginatedObjectPreviewsParams, 'limit' | 'cursor'>) => {
    const query = tables.objectPreview(deps.db).select('*')

    if (params.filter?.status) {
      query.where('previewStatus', params.filter.status)
    }

    return query
  }

export const getPaginatedObjectPreviewsPageFactory =
  (deps: { db: Knex }): GetPaginatedObjectPreviewsPage =>
  async (params) => {
    const { limit, cursor } = params
    const query = getPaginatedObjectsPreviewsBaseQueryFactory(deps)(params)
      .orderBy('lastUpdate', 'desc') //newest first
      .limit(limit)

    if (cursor) {
      query.where('lastUpdate', '<', decodeCursor(cursor)) //everything older than the cursor
    }

    const items = await query

    return {
      items,
      cursor: items.length
        ? encodeCursor(items[items.length - 1].lastUpdate.toISOString())
        : null
    }
  }

export const getPaginatedObjectPreviewsTotalCountFactory =
  (deps: { db: Knex }): GetPaginatedObjectPreviewsTotalCount =>
  async (params) => {
    const baseQ = getPaginatedObjectsPreviewsBaseQueryFactory(deps)(params)
    const q = deps.db.count<{ count: string }[]>().from(baseQ.as('sq1'))
    const [row] = await q

    return parseInt(row.count || '0')
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

export const updateObjectPreviewFactory =
  ({ db }: { db: Knex }): UpdateObjectPreview =>
  async ({ objectPreview }) => {
    return await tables
      .objectPreview(db)
      .where({
        streamId: objectPreview.streamId,
        objectId: objectPreview.objectId
      })
      .update(objectPreview)
      .returning<ObjectPreviewRecord[]>('*')
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
