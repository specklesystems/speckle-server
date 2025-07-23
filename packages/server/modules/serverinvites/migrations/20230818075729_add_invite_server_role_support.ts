import type { Knex } from 'knex'

const TABLE_NAME = 'server_invites'
const COL_NAME = 'serverRole'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.string(COL_NAME).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    // Drop token field
    table.dropColumn(COL_NAME)
  })
}
