import { Knex } from 'knex'

const REVISIONS_TABLE_NAME = 'automation_revisions'
const TRIGGERS_TABLE_NAME = 'automation_triggers'
const AUTOMATION_RUNS_TABLE_NAME = 'automation_runs'
const AUTOMATION_FUNCTION_RUNS_TABLE_NAME = 'automation_function_runs'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(REVISIONS_TABLE_NAME, (table) => {
    table.dropColumn('triggers')
    table.dropColumn('published')
  })
  await knex.schema.alterTable(AUTOMATION_RUNS_TABLE_NAME, (table) => {
    table.dropColumn('versionId')
    table.dropColumn('automationId')
    table.text('executionEngineRunId').nullable().defaultTo(null)
  })
  await knex.schema.createTable(TRIGGERS_TABLE_NAME, (table) => {
    table
      .text('automationRevisionId')
      .references('id')
      .inTable('automation_revisions')
      .onDelete('cascade')
    // currently supported value is "modelVersions"
    // this is not a pg enum type while we figure things out
    table.text('triggerType').notNullable()
    table.text('triggeringId').notNullable()
    table.primary(['automationRevisionId', 'triggerType', 'triggeringId'])
  })

  await knex.schema.createTable(AUTOMATION_FUNCTION_RUNS_TABLE_NAME, (table) => {
    table.text('id').primary({ constraintName: 'automation_function_run_id_pk' })
    table
      .text('runId')
      .references('id')
      .inTable(AUTOMATION_RUNS_TABLE_NAME)
      .onDelete('cascade')
      .notNullable()

    table.text('functionId').notNullable()
    table.text('functionReleaseId').notNullable()
    table.float('elapsed').notNullable()
    table.text('status').notNullable()
    table.text('contextView')
    table.text('statusMessage')
    table.jsonb('results').nullable()

    table.index('runId')
  })
}

export async function down(knex: Knex): Promise<void> {
  // delete invalid data
  await knex.delete().from(AUTOMATION_RUNS_TABLE_NAME)

  await knex.schema.alterTable(REVISIONS_TABLE_NAME, (table) => {
    // old schema
    table.jsonb('triggers').notNullable().defaultTo('[]')
    table.boolean('published').notNullable().defaultTo(false)
  })
  await knex.schema.alterTable(AUTOMATION_RUNS_TABLE_NAME, (table) => {
    table
      .text('versionId')
      .notNullable()
      .references('id')
      .inTable('commits')
      .onDelete('cascade')
    table.dropColumn('executionEngineRunId')
    table
      .text('automationId')
      .notNullable()
      .references('id')
      .inTable('automations')
      .onDelete('cascade')
  })
  await knex.schema.dropTable(TRIGGERS_TABLE_NAME)
  await knex.schema.dropTable(AUTOMATION_FUNCTION_RUNS_TABLE_NAME)
}
