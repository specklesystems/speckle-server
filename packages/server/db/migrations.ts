import { Knex } from 'knex'
import { DatabaseError } from '@/modules/shared/errors'
import { ensureError } from '@speckle/shared'

export const migrateDbToLatest = async (params: { db: Knex; region: string }) => {
  const { db, region } = params
  try {
    await db.migrate.latest()
  } catch (err: unknown) {
    throw new DatabaseError('Error migrating db to latest for region "{region}".', {
      cause: ensureError(err, 'Unknown postgres error'),
      info: { region }
    })
  }
}
