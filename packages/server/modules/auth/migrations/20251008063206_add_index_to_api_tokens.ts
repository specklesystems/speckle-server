import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('api_tokens', (table) => {
    table.index(['owner'])
  })

  await knex.schema.alterTable('personal_api_tokens', (table) => {
    table.index(['tokenId'])
    table.index(['userId'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('api_tokens', (table) => {
    table.dropIndex(['owner'])
  })

  await knex.schema.alterTable('personal_api_tokens', (table) => {
    table.dropIndex(['tokenId'])
    table.dropIndex(['userId'])
  })
}
