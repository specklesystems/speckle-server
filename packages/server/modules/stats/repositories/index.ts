import { Knex } from 'knex'

export const getTotalStreamCountFactory = (deps: { db: Knex }) => async () => {
  const query = 'SELECT COUNT(*) FROM streams'
  const result = await deps.db.raw(query)
  return parseInt(result.rows[0].count)
}

export const getTotalUserCountFactory = (deps: { db: Knex }) => async () => {
  // returns -1 for small tables, no good
  // const fastQuery = "SELECT reltuples::bigint AS estimate FROM pg_catalog.pg_class WHERE relname = 'users'"
  const query = 'SELECT COUNT(*) FROM users'
  const result = await deps.db.raw(query)
  return parseInt(result.rows[0].count)
}
