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
import { compositeCursorTools } from '@/modules/shared/helpers/dbHelper'
import { omit } from 'lodash-es'

const ObjectPreview = buildTableHelper('object_preview', [
  'streamId',
  'objectId',
  'previewStatus',
  'priority',
  'lastUpdate',
  'preview',
  'attempts'
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
    if (params.filter?.maxNumberOfAttempts) {
      query.where('attempts', '<', params.filter.maxNumberOfAttempts)
    }
    return query
  }

const getCursorTools = () =>
  compositeCursorTools({
    schema: ObjectPreview,
    cols: ['lastUpdate', 'objectId']
  })

export const getPaginatedObjectPreviewsPageFactory =
  (deps: { db: Knex }): GetPaginatedObjectPreviewsPage =>
  async (params) => {
    const { limit, cursor } = params
    const { applyCursorSortAndFilter, resolveNewCursor } = getCursorTools()

    const query = getPaginatedObjectsPreviewsBaseQueryFactory(deps)(params)

    if (cursor) {
      applyCursorSortAndFilter({ query, cursor, sort: 'desc' })
    }

    query.limit(limit)

    const items = await query
    const newCursor = resolveNewCursor(items)

    return {
      items,
      cursor: newCursor
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
    const insertionObject: SetOptional<
      ObjectPreviewRecord,
      'lastUpdate' | 'preview' | 'attempts'
    > = {
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
      .increment(
        ObjectPreview.withoutTablePrefix.col.attempts,
        objectPreview.incrementAttempts ? 1 : 0
      ) // false by default
      .update({
        ...omit(objectPreview, 'incrementAttempts'),
        lastUpdate: new Date() // always update the lastUpdate field
      })
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
