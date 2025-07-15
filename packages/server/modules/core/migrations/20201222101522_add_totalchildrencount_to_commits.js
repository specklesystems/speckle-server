/* istanbul ignore file */
const up = async (knex) => {
  await knex.schema.alterTable('commits', (table) => {
    table.integer('totalChildrenCount')
  })
}

const down = async (knex) => {
  await knex.schema.alterTable('commits', (table) => {
    table.dropColumn('totalChildrenCount')
  })
}

export { up, down }
