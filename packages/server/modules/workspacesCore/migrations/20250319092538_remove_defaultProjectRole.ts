import type { Knex } from 'knex'

const TABLE_NAME = 'workspaces'
const COLUMN_NAME = 'defaultProjectRole'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn(COLUMN_NAME)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table
      .enum(COLUMN_NAME, ['stream:reviewer', 'stream:contributor'])
      .notNullable()
      .defaultTo('stream:contributor')
  })
}
