/* istanbul ignore file */
const up = async (knex) => {
  await knex.schema.createTable('pwdreset_tokens', (table) => {
    table.string('id').defaultTo(knex.raw('gen_random_uuid()')).primary()
    table.string('email', 256).notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now())
  })
}

const down = async (knex) => {
  await knex.schema.dropTableIfExists('pwdreset_tokens')
}

export { up, down }
