// /* istanbul ignore file */
exports.up = async (knex) => {
  await knex.schema.alterTable('server_config', (table) => {
    table.boolean('inviteOnly').defaultTo(false)
  })
}

exports.down = async (knex) => {
  const hasColumn = await knex.schema.hasColumn('server_config', 'inviteOnly')
  if (hasColumn) {
    await knex.schema.alterTable('server_config', (table) => {
      table.dropColumn('inviteOnly')
    })
  }
}
