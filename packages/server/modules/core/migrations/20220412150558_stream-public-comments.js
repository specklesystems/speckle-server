/* istanbul ignore file */
exports.up = async (knex) => {
  await knex.schema.alterTable('streams', (table) => {
    table.boolean('allowPublicComments').defaultTo(false)
  })
}

exports.down = async (knex) => {
  await knex.schema.alterTable('streams', (table) => {
    table.dropColumn('allowPublicComments')
  })
}
