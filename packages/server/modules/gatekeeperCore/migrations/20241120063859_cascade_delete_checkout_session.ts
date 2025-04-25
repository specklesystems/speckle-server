import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('workspace_checkout_sessions', (table) => {
    table.dropForeign(['workspaceId'])
    table
      .foreign('workspaceId')
      .references('id')
      .inTable('workspaces')
      .onDelete('CASCADE')
  })
  await knex.schema.alterTable('workspace_subscriptions', (table) => {
    table.dropForeign(['workspaceId'])
    table
      .foreign('workspaceId')
      .references('id')
      .inTable('workspaces')
      .onDelete('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('workspace_checkout_sessions', (table) => {
    table.dropForeign(['workspaceId'])
    table.foreign('workspaceId').references('id').inTable('workspaces')
  })

  await knex.schema.alterTable('workspace_subscriptions', (table) => {
    table.dropForeign(['workspaceId'])
    table.foreign('workspaceId').references('id').inTable('workspaces')
  })
}
