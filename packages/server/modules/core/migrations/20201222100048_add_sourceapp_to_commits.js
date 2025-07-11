/* istanbul ignore file */
const up = async (knex) => {
  await knex.schema.alterTable('commits', (table) => {
    table.string('sourceApplication', 1024)
  })
}

const down = async (knex) => {
  await knex.schema.alterTable('commits', (table) => {
    table.dropColumn('sourceApplication')
  })
}

export { up, down }
