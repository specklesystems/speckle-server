/* istanbul ignore file */
'use strict'

exports.up = async (knex) => {
  await knex.schema.createTable('webhooks_config', (table) => {
    table.string('id').primary()
    table.string('streamId', 10).references('id').inTable('streams').onDelete('cascade')
    table.text('url')
    table.text('description')
    table.jsonb('triggers')
    table.string('secret')
    table.boolean('enabled').defaultTo(true)

    table.index('streamId')
  })

  await knex.schema.createTable('webhooks_events', (table) => {
    table.string('id').primary()
    table
      .string('webhookId')
      .references('id')
      .inTable('webhooks_config')
      .onDelete('cascade')

    table.integer('status').notNullable().defaultTo(0)
    table.text('statusInfo').notNullable().defaultTo('Pending')

    table.timestamp('lastUpdate').notNullable().defaultTo(knex.fn.now())

    table.text('payload')

    table.index('webhookId')
    table.index('status')
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('webhooks_events')
  await knex.schema.dropTableIfExists('webhooks_config')
}
