import type { Knex } from 'knex'

const tableName = 'streams'
const isPublicCol = 'isPublic'
const isDiscoverableCol = 'isDiscoverable'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn(isPublicCol)
    table.dropColumn(isDiscoverableCol)
  })
}

export async function down(knex: Knex): Promise<void> {
  // Re-introduce old cols
  await knex.schema.alterTable(tableName, (table) => {
    table.boolean(isPublicCol).defaultTo(true)
    table.boolean(isDiscoverableCol).defaultTo(false).notNullable()
  })
}
