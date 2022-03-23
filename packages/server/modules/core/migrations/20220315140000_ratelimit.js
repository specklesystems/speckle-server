/* istanbul ignore file */
exports.up = async (knex) => {
  await knex.schema.createTable('ratelimit_actions', (table) => {
    table.timestamp('timestamp').defaultTo(knex.fn.now())
    table.string('action').notNullable()
    table.string('source').notNullable()

    table.index(['source', 'action', 'timestamp'], 'ratelimit_query_idx')
  })
  await knex.schema.alterTable('users', (table) => {
    table.string('ip', 50)
  })
}

exports.down = async (knex) => {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('ip')
  })
  await knex.schema.dropTableIfExists('ratelimit_actions')
}
