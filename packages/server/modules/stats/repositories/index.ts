import { Knex } from 'knex'

export const getTotalStreamCountFactory = (deps: { db: Knex }) => async () => {
  const query = 'SELECT COUNT(*) FROM streams'
  const result = await deps.db.raw(query)
  return parseInt(result.rows[0].count)
}

export const getTotalCommitCountFactory = (deps: { db: Knex }) => async () => {
  const query = 'SELECT COUNT(*) FROM commits'
  const result = await deps.db.raw(query)
  return parseInt(result.rows[0].count)
}

export const getTotalObjectCountFactory = (deps: { db: Knex }) => async () => {
  const query = 'SELECT COUNT(*) FROM objects'
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

export const getStreamHistoryFactory = (deps: { db: Knex }) => async () => {
  const query = `
    SELECT
      DATE_TRUNC('month', streams. "createdAt") AS created_month,
      COUNT(id) AS count
    FROM
      streams
    GROUP BY
      DATE_TRUNC('month', streams. "createdAt")
    `

  const result = (await deps.db.raw(query)) as {
    rows: Array<{ created_month: Date; count: string | number }>
  }
  result.rows.forEach((row) => (row.count = parseInt(row.count + '')))
  return result.rows
}

export const getCommitHistoryFactory = (deps: { db: Knex }) => async () => {
  const query = `
    SELECT
      DATE_TRUNC('month', commits. "createdAt") AS created_month,
      COUNT(id) AS count
    FROM
      commits
    GROUP BY
      DATE_TRUNC('month', commits. "createdAt")
    `
  const result = (await deps.db.raw(query)) as {
    rows: Array<{ created_month: Date; count: string | number }>
  }
  result.rows.forEach((row) => (row.count = parseInt(row.count + '')))
  return result.rows
}

export const getObjectHistoryFactory = (deps: { db: Knex }) => async () => {
  const query = `
    SELECT
      DATE_TRUNC('month', objects. "createdAt") AS created_month,
      COUNT(id) AS count
    FROM
      objects
    GROUP BY
      DATE_TRUNC('month', objects. "createdAt")
    `
  const result = (await deps.db.raw(query)) as {
    rows: Array<{ created_month: Date; count: string | number }>
  }
  result.rows.forEach((row) => (row.count = parseInt(row.count + '')))
  return result.rows
}

export const getUserHistoryFactory = (deps: { db: Knex }) => async () => {
  const query = `
    SELECT
      DATE_TRUNC('month', users. "createdAt") AS created_month,
      COUNT(id) AS count
    FROM
      users
    GROUP BY
      DATE_TRUNC('month', users. "createdAt")
    `
  const result = (await deps.db.raw(query)) as {
    rows: Array<{ created_month: Date; count: string | number }>
  }
  result.rows.forEach((row) => (row.count = parseInt(row.count + '')))
  return result.rows
}
