import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('personal_api_tokens', (table) => {
    table.primary(['tokenId', 'userId'])
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('personal_api_tokens', (table) => {
    table.dropPrimary()
  })
}
