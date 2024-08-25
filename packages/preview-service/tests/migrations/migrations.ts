import type { Knex } from 'knex'

const OBJECT_PREVIEW_TABLE_NAME = 'object_preview'
const PREVIEWS_TABLE_NAME = 'previews'
export const OBJECTS_TABLE_NAME = 'objects'
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
    tableNames.length === 3 &&
    [OBJECT_PREVIEW_TABLE_NAME, OBJECTS_TABLE_NAME, PREVIEWS_TABLE_NAME].every((t) =>
      tableNames.includes(t)
    )
  )
}

const throwIfNotSafeToMigrateUp = async (deps: { db: Knex }) => {
  await throwIfDbNameDoesNotStartWithPrefix(deps)

  const { rows } = await getAllTableNames(deps)
  const tableNames = rows.map((x) => x.tablename)
  if (tableNames.length > 0 && !hasExpectedTableNames({ tableNames })) {
    throw new Error(
      `Database has unexpected tables, it is unsafe to migrate to test schema. Aborting. Tables found: ${tableNames.join(
        ', '
      )}`
    )
  }
}

const throwIfNotSafeToMigrateDown = async (deps: { db: Knex }) => {
  await throwIfDbNameDoesNotStartWithPrefix(deps)

  const { rows } = await getAllTableNames(deps)
  const tableNames = rows.map((x) => x.tablename)
  if (!hasExpectedTableNames({ tableNames })) {
    throw new Error(
      `Database already has unexpected tables, it is unsafe to migrate to test schema. Aborting. Tables found: ${tableNames.join(
        ', '
      )}`
    )
  }
}

export const up = async (db: Knex) => {
  await throwIfNotSafeToMigrateUp({ db })

  await db.schema.createTable(OBJECT_PREVIEW_TABLE_NAME, (table) => {
    table.string('streamId', 10) //ignoring fk on streams table for simplicity
    table.string('objectId').notNullable()
    table.integer('previewStatus').notNullable().defaultTo(0) //TODO should be an enum
    table.integer('priority').notNullable().defaultTo(1)
    table.timestamp('lastUpdate').notNullable().defaultTo(db.fn.now())
    table.jsonb('preview')
    table.primary(['streamId', 'objectId'])
    table.index(['previewStatus', 'priority', 'lastUpdate'])
  })

  await db.schema.createTable(PREVIEWS_TABLE_NAME, (table) => {
    table.string('id').primary()
    table.binary('data')
  })

  await db.schema.createTable(OBJECTS_TABLE_NAME, (table) => {
    table.string('id')
    table.string('streamId', 10) //ignoring fk on streams table for simplicity
    table.string('speckleType', 1024).defaultTo('Base').notNullable()
    table.integer('totalChildrenCount')
    table.jsonb('totalChildrenCountByDepth')
    table.timestamp('createdAt').defaultTo(db.fn.now())
    table.jsonb('data')
    table.index('id')
    table.index('streamId')
    table.primary(['streamId', 'id'])
  })
}

export const down = async (db: Knex) => {
  await throwIfNotSafeToMigrateDown({ db })
  await db.schema.dropTable(OBJECT_PREVIEW_TABLE_NAME)
  await db.schema.dropTable(PREVIEWS_TABLE_NAME)
  await db.schema.dropTable(OBJECTS_TABLE_NAME)
}
