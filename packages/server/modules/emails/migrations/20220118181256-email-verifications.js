/* istanbul ignore file */
'use strict'

exports.up = async (knex) => {
  await knex.schema.createTable('email_verifications', (table) => {
    table.string('id').primary()
    table.string('email')
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.boolean('used').defaultTo(false)
    table.index('email')
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('email_verifications')
}
