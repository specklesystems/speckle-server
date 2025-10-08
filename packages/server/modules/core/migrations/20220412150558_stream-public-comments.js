/* istanbul ignore file */
const up = async (knex) => {
  await knex.schema.alterTable('streams', (table) => {
    table.boolean('allowPublicComments').defaultTo(false)
  })
}

const down = async (knex) => {
  await knex.schema.alterTable('streams', (table) => {
    table.dropColumn('allowPublicComments')
  })
}

export { up, down }
