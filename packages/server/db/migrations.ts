import { Knex } from 'knex'
import { logger } from '@/logging/logging'

export const migrateDbToLatestFactory =
  (params: { db: Knex; region: string }) => async () => {
    const { db, region } = params
    try {
      await db.migrate.latest()
    } catch (err: unknown) {
      logger.error(
        { err, region },
        'Error migrating db to latest for region "{region}".'
      )
    }
  }
