import type { Knex } from 'knex'

const TABLE_NAME = 'stream_activity'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.index('actionType')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropIndex('actionType')
  })
}
