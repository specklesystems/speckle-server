import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // clearing all items in the table, as they do not have the content field set
  await knex('dashboard_api_tokens').truncate()
  await knex.schema.alterTable('dashboard_api_tokens', (table) => {
    table.string('content').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('dashboard_api_tokens', (table) => {
    table.dropColumn('content')
  })
}
