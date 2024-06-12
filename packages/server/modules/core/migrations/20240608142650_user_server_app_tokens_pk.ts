import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_server_app_tokens', (table) => {
    table.primary(['appId', 'tokenId', 'userId'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_server_app_tokens', (table) => {
    table.dropPrimary()
  })
}
