import type { Knex } from 'knex'

const getAllTableNames = (deps: { db: Knex }) => {
  return deps.db.raw<{ rows: { tablename: string }[] }>(
    `SELECT tablename FROM pg_tables WHERE schemaname='public'`
  )
}

const throwIfNotSafeToMigrateUp = async (deps: { db: Knex }) => {
  const { rows } = await getAllTableNames(deps)
  const tableNames = rows.map((x) => x.tablename)
  if (
    tableNames.length > 1 ||
    (tableNames.length === 1 &&
      !['object_preview'].every((t) => tableNames.includes(t)))
  ) {
    throw new Error(
      'Database already has tables, it is unsafe to migrate to test schema. Aborting.'
    )
  }
}

const throwIfNotSafeToMigrateDown = async (deps: { db: Knex }) => {
  const { rows } = await getAllTableNames(deps)
  const tableNames = rows.map((x) => x.tablename)
  if (
    tableNames.length !== 1 ||
    (tableNames.length === 1 &&
      !['object_preview'].every((t) => tableNames.includes(t)))
  ) {
    throw new Error(
      'Database already has tables, it is unsafe to migrate to test schema. Aborting.'
    )
  }
}

export const up = async (db: Knex) => {
  await throwIfNotSafeToMigrateUp({ db })

  return db.schema.createTable('object_preview', (table) => {
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
  return db.schema.dropTable('object_preview')
}
