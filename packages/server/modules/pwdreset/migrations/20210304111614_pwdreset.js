/* istanbul ignore file */
exports.up = async (knex) => {
  await knex.schema.createTable('pwdreset_tokens', (table) => {
    table.string('id').defaultTo(knex.raw('gen_random_uuid()')).primary()
    table.string('email', 256).notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now())
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('pwdreset_tokens')
}
