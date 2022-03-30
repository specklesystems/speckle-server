/* istanbul ignore file */
'use strict'

exports.up = async (knex) => {
  await knex.schema.createTable('object_preview', (table) => {
    table.string('streamId', 10).references('id').inTable('streams').onDelete('cascade')
    table.string('objectId').notNullable()
    table.integer('previewStatus').notNullable().defaultTo(0)
    table.integer('priority').notNullable().defaultTo(1)
    table.timestamp('lastUpdate').notNullable().defaultTo(knex.fn.now())
    table.jsonb('preview')
    table.primary(['streamId', 'objectId'])
    table.index(['previewStatus', 'priority', 'lastUpdate'])
  })

  await knex.schema.createTable('previews', (table) => {
    table.string('id').primary()
    table.binary('data')
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('object_preview')
  await knex.schema.dropTableIfExists('previews')
}
