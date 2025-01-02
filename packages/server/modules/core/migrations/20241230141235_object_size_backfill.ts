import type { Knex } from 'knex'
import { coreLogger } from '@/modules/core/logger'
import { estimateStringifiedObjectSize } from '@/modules/core/services/objects/management'
import type { ObjectRecord } from '@/modules/core/helpers/types'
import { scanTableFactory } from '@/modules/core/helpers/scanTable'

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

  let currentIteration = 1
  for await (const rows of scanTableFactory({ db: knex })(
    {
      tableName: 'objects',
      batchSize
    },
    { failsafeLimitMultiplier: maxLoops }
  )) {
    coreLogger.debug(`Starting iteration ${currentIteration} with ${rows.length} rows`)
    if (rows.length) {
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
    }
    currentIteration++
    coreLogger.debug(`Completed iteration ${currentIteration}`)
  }
  coreLogger.debug('Migration object_size_backfill completed')
}

export async function down(): Promise<void> {
  // we cannot tell how many rows were updated, so we cannot delete the data in the column for them
  // no-op
}
