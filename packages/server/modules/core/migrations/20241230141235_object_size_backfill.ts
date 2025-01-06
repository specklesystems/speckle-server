import type { Knex } from 'knex'
import { coreLogger } from '@/modules/core/logger'
import { backfillDataSizeProperty } from '@/modules/core/services/objects/dataSize'

export async function up(knex: Knex): Promise<void> {
  coreLogger.info('Migration object_size_backfill started')
  await backfillDataSizeProperty({ db: knex, logger: coreLogger })
  coreLogger.info('Migration object_size_backfill completed')
}

export async function down(): Promise<void> {
  // we cannot tell how many rows were updated, so we cannot delete the data in the column for them
  // no-op
}
