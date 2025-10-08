import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('embed_api_tokens', (table) => {
    table
      .string('tokenId')
      .notNullable()
      .references('id')
      .inTable('api_tokens')
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
    table.string('resourceIdString').notNullable()
    table.primary(['projectId', 'tokenId'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('embed_api_tokens')
}
