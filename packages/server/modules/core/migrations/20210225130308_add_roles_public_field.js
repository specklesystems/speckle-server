/* istanbul ignore file */
const up = async (knex) => {
  await knex.schema.alterTable('user_roles', (table) => {
    table.boolean('public').defaultTo(true)
  })
}

const down = async (knex) => {
  const hasColumn = await knex.schema.hasColumn('user_roles', 'public')
  if (hasColumn) {
    await knex.schema.alterTable('user_roles', (table) => {
      table.dropColumn('public')
    })
  }
}

export { up, down }
