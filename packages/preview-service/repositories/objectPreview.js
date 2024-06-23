const knex = require('../knex')

async function getNextUnstartedObjectPreview() {
  const [maybeRow] = await knex.raw(`
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

async function updatePreviewMetadata(metadata, streamId, objectId) {
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
    [metadata, streamId, objectId]
  )
}

async function notifyUpdate(streamId, objectId) {
  await knex.raw(`NOTIFY preview_generation_update, 'finished:${streamId}:${objectId}'`)
}

module.exports = {
  getAvailableObjectPreview: getNextUnstartedObjectPreview,
  notifyUpdate,
  updatePreviewMetadata
}
