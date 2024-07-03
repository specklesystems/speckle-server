import type { Preview } from '@/domain/domain.js'
import type { Knex } from 'knex'

export const Previews = (deps: { db: Knex }) => deps.db<Preview>('previews')

export type InsertPreview = (params: Preview) => Promise<void>
export const insertPreviewFactory = (deps: { db: Knex }) => async (params: Preview) => {
  const { db } = deps
  await db.raw(
    'INSERT INTO "previews" (id, data) VALUES (?, ?) ON CONFLICT DO NOTHING',
    [params.previewId, params.imgBuffer]
  )
}
