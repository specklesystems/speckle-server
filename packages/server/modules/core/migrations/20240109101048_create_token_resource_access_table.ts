import type { Knex } from 'knex'

const TABLE_NAME = 'token_resource_access'
const TOKENS_TABLE_NAME = 'api_tokens'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table
      .string('tokenId', 10)
      .notNullable()
      .references('id')
      .inTable(TOKENS_TABLE_NAME)
      .onDelete('cascade')

    table.string('resourceId').notNullable()
    table.string('resourceType').notNullable()

    // Add idx to tokenId
    table.index('tokenId')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(TABLE_NAME)
}
