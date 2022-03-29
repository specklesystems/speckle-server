/* istanbul ignore file */
exports.up = async (knex) => {
  await knex.schema.alterTable('commits', (table) => {
    table.string('sourceApplication', 1024)
  })
}

exports.down = async (knex) => {
  await knex.schema.alterTable('commits', (table) => {
    table.dropColumn('sourceApplication')
  })
}
