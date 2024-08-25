import type { Angle, ObjectIdentifier, PreviewId } from '@/domain/domain.js'
import type { Knex } from 'knex'

export type ObjectPreviewRow = ObjectIdentifier & {
  preview: Record<Angle, PreviewId>
  previewStatus: number
  lastUpdate: number
}
export const ObjectPreview = (deps: { db: Knex }) =>
  deps.db<ObjectPreviewRow>('object_preview')

export type GetNextUnstartedObjectPreview = () => Promise<ObjectIdentifier>
export const getNextUnstartedObjectPreviewFactory =
  (deps: { db: Knex }): GetNextUnstartedObjectPreview =>
  async () => {
    const { db } = deps
    const {
      rows: [maybeRow]
    } = await db.raw<{ rows: ObjectIdentifier[] }>(`
    UPDATE object_preview
    SET
      "previewStatus" = 1,
      "lastUpdate" = NOW()
    FROM (
      SELECT "streamId", "objectId" FROM object_preview
      WHERE "previewStatus" = 0 OR ("previewStatus" = 1 AND "lastUpdate" < NOW() - INTERVAL '1 WEEK')
      ORDER BY "priority" ASC, "lastUpdate" ASC
      LIMIT 1
    ) as task
    WHERE object_preview."streamId" = task."streamId" AND object_preview."objectId" = task."objectId"
    RETURNING object_preview."streamId", object_preview."objectId"
  `)
    return maybeRow
  }

export type UpdatePreviewMetadataParams = ObjectIdentifier & {
  metadata: Record<string, string>
}
export type UpdatePreviewMetadata = (
  params: UpdatePreviewMetadataParams
) => Promise<void>
export const updatePreviewMetadataFactory =
  (deps: { db: Knex }): UpdatePreviewMetadata =>
  async (params) => {
    const { db } = deps
    // Update preview metadata
    await db.raw<void>(
      `
      UPDATE object_preview
      SET
        "previewStatus" = 2,
        "lastUpdate" = NOW(),
        "preview" = ?
      WHERE "streamId" = ? AND "objectId" = ?
    `,
      [params.metadata, params.streamId, params.objectId]
    )
  }

export type NotifyUpdate = (params: ObjectIdentifier) => Promise<void>
export const notifyUpdateFactory =
  (deps: { db: Knex }): NotifyUpdate =>
  async (params) => {
    const { db } = deps
    await db.raw<void>(
      `NOTIFY preview_generation_update, 'finished:${params.streamId}:${params.objectId}'`
    )
  }
