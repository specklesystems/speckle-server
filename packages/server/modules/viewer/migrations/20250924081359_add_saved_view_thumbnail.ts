import type { Knex } from 'knex'
import sharp from 'sharp'
import { logger } from '@/observability/logging.js'

const tableName = 'saved_views'
const col = 'thumbnail'

/**
 * intentional copypasta - migrations shouldn't depend on other modules so they never break
 */

const THUMBNAIL_WIDTH = 420
const THUMBNAIL_HEIGHT = 240

const screenshotToBuffer = (screenshot: string) => {
  // no `data:image/png;base64,` prefix
  const preview = screenshot.replace(/^data:image\/png;base64,/, '')
  return Buffer.from(preview, 'base64')
}

const downscaleScreenshotForThumbnail = async (params: { screenshot: string }) => {
  const { screenshot } = params
  const imgBuffer = screenshotToBuffer(screenshot)

  // Use sharp to get metadata
  const image = sharp(imgBuffer)
  const meta = await image.metadata()
  const { width: srcW, height: srcH } = meta

  // If source is already smaller or equal in both dimensions, do nothing
  if (srcW <= THUMBNAIL_WIDTH && srcH <= THUMBNAIL_HEIGHT) {
    return screenshot
  }

  // Otherwise, resize (downscale). Use withoutEnlargement to guard.
  const outBuf = await image
    .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
      fit: 'inside', // ensures we maintain aspect ratio and fit *within* box
      withoutEnlargement: true
    })
    // Optionally, set output format / quality depending on mimeType
    .toFormat(meta.format || 'png', { quality: 80 }) // e.g. JPEG/WebP or PNG
    .toBuffer()

  // Convert back to base64 with prefix
  const outB64 = outBuf.toString('base64')
  const prefix = `data:image/png;base64,`
  return `${prefix}${outB64}`
}

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.text(col).defaultTo('')
  })

  // Backfill existing rows with downscaled versions of their screenshots in batches of 4
  const batchSize = 4
  const maxRows = 100000 // Failsafe: don't process more than 100k rows
  let lastProcessedId = ''
  let totalProcessed = 0
  let totalGenerated = 0

  logger.info(`Starting thumbnail generation for ${tableName} table`)

  while (totalProcessed < maxRows) {
    // Get a batch of saved views that have screenshots but no thumbnails
    // Use cursor-based pagination to avoid offset issues when updating rows
    const batch = await knex(tableName)
      .select('id', 'screenshot')
      .whereNotNull('screenshot')
      .where('screenshot', '!=', '')
      .where((builder) => {
        builder.whereNull(col).orWhere(col, '=', '')
      })
      .where('id', '>', lastProcessedId)
      .orderBy('id', 'asc')
      .limit(batchSize)

    if (batch.length === 0) {
      break // No more rows to process
    }

    // Process all rows in the batch concurrently using Promise.all
    const results = await Promise.all(
      batch.map(async (row) => {
        try {
          if (row.screenshot) {
            const thumbnail = await downscaleScreenshotForThumbnail({
              screenshot: row.screenshot
            })

            await knex(tableName)
              .where('id', row.id)
              .update({ [col]: thumbnail })

            return { success: true, id: row.id }
          }
          return { success: false, id: row.id, error: 'No screenshot' }
        } catch (error) {
          logger.warn(`Failed to generate thumbnail for saved view ${row.id}`, {
            error
          })
          return { success: false, id: row.id, error }
        }
      })
    )

    // Count successful generations
    const successCount = results.filter((r) => r.success).length
    totalProcessed += batch.length
    totalGenerated += successCount

    // Update cursor to the highest ID processed in this batch
    lastProcessedId = batch[batch.length - 1].id

    // Report progress every batch
    logger.info(
      `Processed batch: ${successCount}/${batch.length} thumbnails generated. Total: ${totalGenerated}/${totalProcessed}`
    )
  }

  if (totalProcessed >= maxRows) {
    logger.warn(
      `Hit failsafe limit of ${maxRows} rows. Some rows may not have been processed.`
    )
  }

  logger.info(
    `Thumbnail generation complete. Generated ${totalGenerated} thumbnails from ${totalProcessed} processed rows.`
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn(col)
  })
}
