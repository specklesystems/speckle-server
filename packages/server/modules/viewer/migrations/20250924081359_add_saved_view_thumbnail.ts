import type { Knex } from 'knex'

const tableName = 'saved_views'
const col = 'thumbnail'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.text(col).defaultTo('')
  })

  // Update all existing rows to copy screenshot -> thumbnail
  await knex.raw(`UPDATE ${tableName} SET ${col} = screenshot WHERE ${col} = ''`)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn(col)
  })
}
