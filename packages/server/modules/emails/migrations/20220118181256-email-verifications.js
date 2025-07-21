/* istanbul ignore file */
'use strict'

const up = async (knex) => {
  await knex.schema.createTable('email_verifications', (table) => {
    table.string('id').primary()
    table.string('email')
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.boolean('used').defaultTo(false)
    table.index('email')
  })
}

const down = async (knex) => {
  await knex.schema.dropTableIfExists('email_verifications')
}

export { up, down }
