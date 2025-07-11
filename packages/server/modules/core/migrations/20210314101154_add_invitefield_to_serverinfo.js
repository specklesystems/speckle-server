// /* istanbul ignore file */
const up = async (knex) => {
  await knex.schema.alterTable('server_config', (table) => {
    table.boolean('inviteOnly').defaultTo(false)
  })
}

const down = async (knex) => {
  const hasColumn = await knex.schema.hasColumn('server_config', 'inviteOnly')
  if (hasColumn) {
    await knex.schema.alterTable('server_config', (table) => {
      table.dropColumn('inviteOnly')
    })
  }
}

export { up, down }
