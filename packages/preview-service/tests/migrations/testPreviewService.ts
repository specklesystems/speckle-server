import type { Knex } from 'knex'

export const up = (db: Knex) => {
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
  return db.schema.dropTable('object_preview')
}
