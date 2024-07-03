import type { Knex } from 'knex'

export const up = (db: Knex) => {
  //TODO validate that this database has no existing tables, or only the object_preview table
  //i.e. ensure we aren't connected to an existing production database!
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

export const down = (db: Knex) => {
  //TODO validate that this database only has the object_preview table, and no other tables
  //i.e. ensure we aren't connected to a production database!
  return db.schema.dropTable('object_preview')
}
