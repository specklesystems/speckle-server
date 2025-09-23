import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('saved_view_group_api_tokens', (table) => {
    table
      .string('tokenId')
      .notNullable()
      .references('id')
      .inTable('api_tokens')
      .onDelete('cascade')
    table
      .string('savedViewGroupId')
      .notNullable()
      .references('id')
      .inTable('saved_view_groups')
      .onDelete('cascade')
    table
      .string('projectId')
      .notNullable()
      .references('id')
      .inTable('streams')
      .onDelete('cascade')
    table
      .string('userId')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('cascade')
    table.primary(['savedViewGroupId', 'tokenId'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('saved_view_group_api_tokens')
}
