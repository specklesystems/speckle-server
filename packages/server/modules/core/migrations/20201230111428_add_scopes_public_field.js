/* istanbul ignore file */
exports.up = async (knex) => {
  await knex.schema.alterTable('scopes', (table) => {
    table.boolean('public').defaultTo(true)
  })
}

exports.down = async (knex) => {
  const hasColumn = await knex.schema.hasColumn('scopes', 'public')
  if (hasColumn) {
    await knex.schema.alterTable('scopes', (table) => {
      table.dropColumn('public')
    })
  }
}
