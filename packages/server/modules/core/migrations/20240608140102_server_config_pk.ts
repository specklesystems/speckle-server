import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('server_config', (table) => {
    table.primary(['id'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('server_config', (table) => {
    table.dropPrimary()
  })
}
