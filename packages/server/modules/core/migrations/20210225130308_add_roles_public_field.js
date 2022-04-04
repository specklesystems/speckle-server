/* istanbul ignore file */
exports.up = async (knex) => {
  await knex.schema.alterTable('user_roles', (table) => {
    table.boolean('public').defaultTo(true)
  })
}

exports.down = async (knex) => {
  const hasColumn = await knex.schema.hasColumn('user_roles', 'public')
  if (hasColumn) {
    await knex.schema.alterTable('user_roles', (table) => {
      table.dropColumn('public')
    })
  }
}
