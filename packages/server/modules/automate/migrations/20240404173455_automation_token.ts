import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('automation_tokens', (table) => {
    // yes I'm using an FK as a PK. it's deliberately a 1-1 relationship
    // the tokens are a lot more sensitive, that should only be queried if needed
    // so i decided to store them in a separate table
    table
      .text('automationId')
      .primary()
      .references('id')
      .inTable('automations')
      .onDelete('cascade')
    table.text('automateToken').notNullable()
  })
  await knex.schema.alterTable('automation_runs', (table) => {
    table.dropColumns('functionRuns', 'triggers')
  })
  await knex.schema.alterTable('automations', (table) => {
    table.text('executionEngineAutomationId').notNullable().defaultTo('')
    table.text('userId').references('id').inTable('users').onDelete('SET NULL')
  })
  await knex.schema.alterTable('automation_revisions', (table) => {
    table.text('userId').references('id').inTable('users').onDelete('SET NULL')
  })
  await knex.schema.createTable('automation_run_triggers', (table) => {
    table
      .text('automationRunId')
      .references('id')
      .inTable('automation_runs')
      .onDelete('CASCADE')
      .notNullable()
    table.text('triggeringId').notNullable()
    table.text('triggerType').notNullable().index()
    table.primary(['automationRunId', 'triggeringId'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('automation_tokens')
  await knex.schema.dropTable('automation_run_triggers')
  await knex.schema.alterTable('automations', (table) => {
    table.dropColumns('executionEngineAutomationId', 'userId')
  })

  await knex.schema.alterTable('automation_runs', (table) => {
    table.jsonb('functionRuns').notNullable().defaultTo('{}')
    table.jsonb('triggers').notNullable().defaultTo('{}')
  })

  await knex.schema.alterTable('automation_revisions', (table) => {
    table.dropColumn('userId')
  })
}
