import type { Knex } from 'knex'

const OBJECT_PREVIEW_TABLE_NAME = 'object_preview'
const DB_NAME_PREFIX = 'preview_service_'

const getDatabaseName = (deps: { db: Knex }) => {
  return deps.db.raw<{ rows: { datname: string }[] }>(
    `SELECT current_database() as datname`
  )
}

const getAllTableNames = (deps: { db: Knex }) => {
  return deps.db.raw<{ rows: { tablename: string }[] }>(
    `SELECT tablename FROM pg_tables WHERE schemaname='public'`
  )
}

const throwIfDbNameDoesNotStartWithPrefix = async (deps: { db: Knex }) => {
  const { rows: dbNameRows } = await getDatabaseName(deps)
  const dbName = dbNameRows[0].datname
  if (!dbName.startsWith(DB_NAME_PREFIX)) {
    throw new Error(
      `Database name does not start with "${DB_NAME_PREFIX}", it is unsafe to migrate to test schema. Aborting.`
    )
  }
}

const hasExpectedTableNames = (params: { tableNames: string[] }) => {
  const { tableNames } = params
  return (
    tableNames.length === 1 &&
    [OBJECT_PREVIEW_TABLE_NAME].every((t) => tableNames.includes(t))
  )
}

const throwIfNotSafeToMigrateUp = async (deps: { db: Knex }) => {
  await throwIfDbNameDoesNotStartWithPrefix(deps)

  const { rows } = await getAllTableNames(deps)
  const tableNames = rows.map((x) => x.tablename)
  if (tableNames.length > 0 && !hasExpectedTableNames({ tableNames })) {
    throw new Error(
      'Database has unexpected tables, it is unsafe to migrate to test schema. Aborting.'
    )
  }
}

const throwIfNotSafeToMigrateDown = async (deps: { db: Knex }) => {
  await throwIfDbNameDoesNotStartWithPrefix(deps)

  const { rows } = await getAllTableNames(deps)
  const tableNames = rows.map((x) => x.tablename)
  if (tableNames.length !== 1 || !hasExpectedTableNames({ tableNames })) {
    throw new Error(
      'Database already has unexpected tables, it is unsafe to migrate to test schema. Aborting.'
    )
  }
}

export const up = async (db: Knex) => {
  await throwIfNotSafeToMigrateUp({ db })

  return db.schema.createTable(OBJECT_PREVIEW_TABLE_NAME, (table) => {
    table.string('streamId', 10) //ignoring fk on streams table for simplicity
    table.string('objectId').notNullable()
    table.integer('previewStatus').notNullable().defaultTo(0)
    table.integer('priority').notNullable().defaultTo(1)
    table.timestamp('lastUpdate').notNullable().defaultTo(db.fn.now())
    table.jsonb('preview')
    table.primary(['streamId', 'objectId'])
    table.index(['previewStatus', 'priority', 'lastUpdate'])
  })
}

export const down = async (db: Knex) => {
  await throwIfNotSafeToMigrateDown({ db })
  return db.schema.dropTable(OBJECT_PREVIEW_TABLE_NAME)
}
