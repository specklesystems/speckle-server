import { Knex } from 'knex'

export const migrateDbToLatest = (db: Knex) => async () => {
  await db.migrate.latest()
}
