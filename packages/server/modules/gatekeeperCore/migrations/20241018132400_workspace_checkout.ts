import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('workspace_plans', (table) => {
    // im associating this to the workspace 1-1, i do not want a 1-many relationship possible
    table.text('workspaceId').primary().references('id').inTable('workspaces')
    table.text('name').notNullable()
    table.text('status').notNullable()
  })
  await knex.schema.createTable('workspace_checkout_sessions', (table) => {
    // im associating this to the workspace 1-1, i do not want a 1-many relationship possible
    table.text('workspaceId').primary().references('id').inTable('workspaces')
    // this is not the primaryId, its the stripe provided checkout sessionId
    // but we'll still need to index by it
    table.text('id').notNullable().index()
    table.text('url').notNullable()
    table.text('workspacePlan').notNullable()
    table.text('paymentStatus').notNullable()
    table.text('billingInterval').notNullable()
    table.timestamp('createdAt', { precision: 3, useTz: true }).notNullable()
    table.timestamp('updatedAt', { precision: 3, useTz: true }).notNullable()
  })

  await knex.schema.createTable('workspace_subscriptions', (table) => {
    table.text('workspaceId').primary().references('id').inTable('workspaces')
    table.timestamp('createdAt', { precision: 3, useTz: true }).notNullable()
    table.timestamp('updatedAt', { precision: 3, useTz: true }).notNullable()
    table
      .timestamp('currentBillingCycleEnd', { precision: 3, useTz: true })
      .notNullable()

    table.text('billingInterval').notNullable()
    table.jsonb('subscriptionData').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('workspace_plans')
  await knex.schema.dropTable('workspace_checkout_sessions')
  await knex.schema.dropTable('workspace_subscriptions')
}
