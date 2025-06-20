import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('workspace_subscriptions', (table) => {
    table.jsonb('updateIntent').notNullable().defaultTo('{}')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('workspace_subscriptions', (table) => {
    table.dropColumn('updateIntent')
  })
}
