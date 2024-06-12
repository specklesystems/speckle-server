import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('token_scopes', (table) => {
    table.primary(['tokenId', 'scopeName'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('token_scopes', (table) => {
    table.dropPrimary()
  })
}
