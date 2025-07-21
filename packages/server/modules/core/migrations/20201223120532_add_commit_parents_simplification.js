/* istanbul ignore file */
const up = async (knex) => {
  await knex.schema.dropTableIfExists('parent_commits')
  await knex.schema.alterTable('commits', (table) => {
    table.specificType('parents', 'text[]')
  })
}

const down = async (knex) => {
  const hasColumn = await knex.schema.hasColumn('commits', 'parents')
  if (hasColumn)
    await knex.schema.alterTable('commits', (table) => {
      table.dropColumn('parents')
    })
}

export { up, down }
