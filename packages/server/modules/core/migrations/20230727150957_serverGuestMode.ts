import type { Knex } from 'knex'

const TABLE_NAME = 'server_config'
const COL_NAME = 'guestModeEnabled'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.boolean(COL_NAME).defaultTo(false).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn(COL_NAME)
  })
}
