import { Knex } from 'knex'
import { logger } from '@/logging/logging'

export const migrateDbToLatest = async (params: { db: Knex; region: string }) => {
  const { db, region } = params
  try {
    await db.migrate.latest()
  } catch (err: unknown) {
    logger.error({ err, region }, 'Error migrating db to latest for region "{region}".')
    throw err
  }
}
