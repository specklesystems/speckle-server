import type { Knex } from 'knex'

const tableName = 'saved_views'
const col = 'thumbnail'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.text(col).defaultTo('')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn(col)
  })
}
