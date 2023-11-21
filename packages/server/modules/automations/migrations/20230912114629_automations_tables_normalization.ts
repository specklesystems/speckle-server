import { Knex } from 'knex'

const AUTOMATIONS_TABLE_NAME = 'automations'
const AUTOMATION_RUNS_TABLE_NAME = 'automation_runs'
const AUTOMATION_FUNCTION_RUNS_TABLE_NAME = 'automation_function_runs'
const AUTOMATION_FUNCTION_RUNS_RESULT_VERSIONS_TABLE_NAME =
  'automation_function_runs_result_versions'

export async function up(knex: Knex): Promise<void> {
  // Deleting existing data in case someone's already used the (hidden) API somehow
  // If we don't do this, FKs may cause problems
  await knex(AUTOMATION_RUNS_TABLE_NAME).delete()
  await knex(AUTOMATIONS_TABLE_NAME).delete()

  // Add updatedAt to automations + add modelId FK + webhookId
  await knex.schema.alterTable(AUTOMATIONS_TABLE_NAME, (table) => {
    table
      .timestamp('updatedAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()

    table
      .string('modelId')
      .references('id')
      .inTable('branches')
      .onDelete('cascade')
      .notNullable()
      .alter()

    table.string('webhookId').references('id').inTable('webhooks_config')
  })

  // Remove data column from automation_runs
  await knex.schema.alterTable(AUTOMATION_RUNS_TABLE_NAME, (table) => {
    table.dropColumn('data')
  })

  // Create automation_function_runs table
  await knex.schema.createTable(AUTOMATION_FUNCTION_RUNS_TABLE_NAME, (table) => {
    table
      .string('automationRunId')
      .references('automationRunId')
      .inTable(AUTOMATION_RUNS_TABLE_NAME)
      .onDelete('cascade')
      .notNullable()

    table.string('functionId').notNullable()
    table.float('elapsed').notNullable()
    table.string('status').notNullable()
    table.string('contextView')
    table.string('statusMessage')
    table.jsonb('results').notNullable()

    table.primary(['automationRunId', 'functionId'])
  })

  // Create automation_function_runs_result_versions table
  await knex.schema.createTable(
    AUTOMATION_FUNCTION_RUNS_RESULT_VERSIONS_TABLE_NAME,
    (table) => {
      table.string('automationRunId').notNullable()

      table.string('functionId').notNullable()

      table
        .string('resultVersionId')
        .notNullable()
        .references('id')
        .inTable('commits')
        .notNullable()
        .onDelete('cascade')

      table.primary(['automationRunId', 'functionId', 'resultVersionId'])
      table
        .foreign(['automationRunId', 'functionId'])
        .references(['automationRunId', 'functionId'])
        .inTable(AUTOMATION_FUNCTION_RUNS_TABLE_NAME)
        .onDelete('cascade')
    }
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(AUTOMATIONS_TABLE_NAME, (table) => {
    table.dropForeign('modelId')
    table.dropColumn('updatedAt')
    table.dropColumn('webhookId')
  })

  // Add back data column to automation_runs
  await knex.schema.alterTable(AUTOMATION_RUNS_TABLE_NAME, (table) => {
    table.jsonb('data')
  })

  // Drop automation_function_runs_result_versions table
  await knex.schema.dropTableIfExists(
    AUTOMATION_FUNCTION_RUNS_RESULT_VERSIONS_TABLE_NAME
  )

  // Drop automation_function_runs table
  await knex.schema.dropTableIfExists(AUTOMATION_FUNCTION_RUNS_TABLE_NAME)
}
