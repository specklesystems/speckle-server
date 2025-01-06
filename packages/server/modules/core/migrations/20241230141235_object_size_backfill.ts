import type { Knex } from 'knex'
import { coreLogger } from '@/modules/core/logger'
import { estimateStringifiedObjectSize } from '@/modules/core/services/objects/management'
import type { ObjectRecord } from '@/modules/core/helpers/types'

export async function up(knex: Knex): Promise<void> {
  coreLogger.debug('Migration object_size_backfill started')

  //shortcut if there are no objects to update. Prevents looping over the table if unnecessary.
  const anythingToUpdate = await knex('objects').whereNull('sizeBytes').limit(1)
  if (!anythingToUpdate.length) {
    coreLogger.debug('No objects to update')
    return
  }

  const batchSize = 100
  const [countQuery] = await knex('objects').count()
  const objectsCount = parseInt(countQuery.count.toString())
  const maxLoops = objectsCount / batchSize

  coreLogger.debug(`Number of loops estimated: ${maxLoops}`)

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
    coreLogger.debug(`Starting iteration ${currentIteration}`)
    const rows = await knex(tableName)
      .limit(batchSize)
      .offset(offset)
      .whereNull('sizeBytes')
    currentRowsLength = rows.length
    coreLogger.debug(`Fetched ${rows.length} rows to update with sizeBytes`)

    if (!currentRowsLength) {
      continue
    }
    await knex.transaction(async (trx) => {
      try {
        await Promise.all(
          rows.map((object: ObjectRecord) => {
            if (object.sizeBytes !== null) return
            knex('objects')
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
        coreLogger.error(
          `Error encountered while updating objects during iteration ${currentIteration} of ${maxLoops}. Total rows estimated ${rows.length}. Error: ${err}`
        )
        return trx.rollback(err)
      }
    })

    coreLogger.debug(`Completed iteration ${currentIteration}`)
  } while (currentRowsLength > 0)

  coreLogger.debug('Migration object_size_backfill completed')
}

export async function down(): Promise<void> {
  // we cannot tell how many rows were updated, so we cannot delete the data in the column for them
  // no-op
}
