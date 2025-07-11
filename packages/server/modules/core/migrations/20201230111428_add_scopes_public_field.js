/* istanbul ignore file */
const up = async (knex) => {
  await knex.schema.alterTable('scopes', (table) => {
    table.boolean('public').defaultTo(true)
  })
}

const down = async (knex) => {
  const hasColumn = await knex.schema.hasColumn('scopes', 'public')
  if (hasColumn) {
    await knex.schema.alterTable('scopes', (table) => {
      table.dropColumn('public')
    })
  }
}

export { up, down }
