import type { Knex } from 'knex'
import type { Logger } from 'pino'
import type { ObjectRecord } from '@/modules/core/helpers/types'
import { estimateStringifiedObjectSize } from '@/modules/core/services/objects/management'

export const backfillDataSizeProperty = async (params: {
  db: Knex
  logger: Logger
}): Promise<void> => {
  const { logger, db } = params

  //shortcut if there are no objects to update. Prevents looping over the table if unnecessary.
  const anythingToUpdate = await db('objects').whereNull('sizeBytes').limit(1)
  if (!anythingToUpdate.length) {
    logger.info('No objects to update')
    return
  }

  const batchSize = 100
  const [countQuery] = await db('objects').count()
  const objectsCount = parseInt(countQuery.count.toString())
  const maxLoops = objectsCount / batchSize

  logger.info(`Number of loops estimated: ${maxLoops}`)

  const tableName = 'objects'

  let offset = 0
  let currentIteration = 0
  const failsafeLimit = batchSize * 1000
  let currentRowsLength = 0
  do {
    currentIteration++
    offset += batchSize
    if (offset > failsafeLimit) {
      throw new Error('Never ending loop')
    }
    logger.info(`Starting iteration ${currentIteration}`)

    const rows = await db(tableName).limit(batchSize).whereNull('sizeBytes')
    currentRowsLength = rows.length
    logger.info(`Fetched ${rows.length} rows to update with sizeBytes`)

    if (!currentRowsLength) {
      continue
    }
    await db.transaction(async (trx) => {
      try {
        await Promise.all(
          rows.map((object: ObjectRecord) => {
            if (object.sizeBytes !== null) return
            return db('objects')
              .where('id', object.id)
              .whereNull('sizeBytes') // prevents conflict if another migration has already updated the column since the table was scanned. First update wins.
              .update({
                sizeBytes: estimateStringifiedObjectSize(JSON.stringify(object.data))
              })
              .transacting(trx)
          })
        )
        return trx.commit()
      } catch (err) {
        logger.error(
          `Error encountered while updating objects during iteration ${currentIteration} of ${maxLoops}. Total rows estimated ${rows.length}. Error: ${err}`
        )
        return trx.rollback(err)
      }
    })

    logger.info(`Completed iteration ${currentIteration}`)
  } while (currentRowsLength > 0)
}
