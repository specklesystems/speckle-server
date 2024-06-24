import type { ObjectIdentifier } from 'domain/domain'
import knex from './knex'

export async function getNextUnstartedObjectPreview(): Promise<ObjectIdentifier> {
  const {
    rows: [maybeRow]
  } = await knex.raw(`
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
  return <ObjectIdentifier>maybeRow
}

export type UpdatePreviewMetadataParams = ObjectIdentifier & {
  metadata: string
}
export async function updatePreviewMetadata(params: UpdatePreviewMetadataParams) {
  // Update preview metadata
  await knex.raw(
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

export async function notifyUpdate(params: ObjectIdentifier) {
  await knex.raw(
    `NOTIFY preview_generation_update, 'finished:${params.streamId}:${params.objectId}'`
  )
}
