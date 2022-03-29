/* istanbul ignore file */
exports.up = async (knex) => {
  await knex.schema.alterTable('commits', (table) => {
    table.integer('totalChildrenCount')
  })
}

exports.down = async (knex) => {
  await knex.schema.alterTable('commits', (table) => {
    table.dropColumn('totalChildrenCount')
  })
}
