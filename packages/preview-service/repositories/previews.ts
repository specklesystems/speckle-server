import { Preview } from 'domain/domain'
import type { Knex } from 'knex'

export type InsertPreview = (params: Preview) => Promise<void>
export const insertPreviewFactory = (db: Knex) => async (params: Preview) => {
  await db.raw(
    'INSERT INTO "previews" (id, data) VALUES (?, ?) ON CONFLICT DO NOTHING',
    [params.previewId, params.imgBuffer]
  )
}
