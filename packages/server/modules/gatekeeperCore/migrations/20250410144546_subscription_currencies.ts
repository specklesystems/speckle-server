import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('workspace_checkout_sessions', (table) => {
    table.text('currency').notNullable().defaultTo('gbp')
  })
  await knex.schema.alterTable('workspace_subscriptions', (table) => {
    table.text('currency').notNullable().defaultTo('gbp')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('workspace_checkout_sessions', (table) => {
    table.dropColumn('currency')
  })
  await knex.schema.alterTable('workspace_subscriptions', (table) => {
    table.dropColumn('currency')
  })
}
