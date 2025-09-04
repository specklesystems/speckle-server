import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('dashboard_api_tokens', (table) => {
    table
      .string('tokenId')
      .notNullable()
      .references('id')
      .inTable('api_tokens')
      .onDelete('cascade')
    table
      .string('dashboardId')
      .notNullable()
      .references('id')
      .inTable('dashboards')
      .onDelete('cascade')
    table
      .string('userId')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('cascade')
    table.primary(['dashboardId', 'tokenId'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('dashboard_api_tokens')
}
