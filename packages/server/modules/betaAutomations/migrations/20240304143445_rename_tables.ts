import { Knex } from 'knex'

const AUTOMATIONS_TABLE_NAME_OLD = 'automations'
const AUTOMATION_RUNS_TABLE_NAME_OLD = 'automation_runs'
const AUTOMATION_FUNCTION_RUNS_TABLE_NAME_OLD = 'automation_function_runs'
const AUTOMATION_FUNCTION_RUNS_RESULT_VERSIONS_TABLE_NAME_OLD =
  'automation_function_runs_result_versions'

const AUTOMATIONS_TABLE_NAME_NEW = 'beta_automations'
const AUTOMATION_RUNS_TABLE_NAME_NEW = 'beta_automation_runs'
const AUTOMATION_FUNCTION_RUNS_TABLE_NAME_NEW = 'beta_automation_function_runs'
const AUTOMATION_FUNCTION_RUNS_RESULT_VERSIONS_TABLE_NAME_NEW =
  'beta_automation_function_runs_result_versions'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.renameTable(AUTOMATIONS_TABLE_NAME_OLD, AUTOMATIONS_TABLE_NAME_NEW)
  await knex.schema.renameTable(
    AUTOMATION_RUNS_TABLE_NAME_OLD,
    AUTOMATION_RUNS_TABLE_NAME_NEW
  )
  await knex.schema.renameTable(
    AUTOMATION_FUNCTION_RUNS_TABLE_NAME_OLD,
    AUTOMATION_FUNCTION_RUNS_TABLE_NAME_NEW
  )
  await knex.schema.renameTable(
    AUTOMATION_FUNCTION_RUNS_RESULT_VERSIONS_TABLE_NAME_OLD,
    AUTOMATION_FUNCTION_RUNS_RESULT_VERSIONS_TABLE_NAME_NEW
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.renameTable(AUTOMATIONS_TABLE_NAME_NEW, AUTOMATIONS_TABLE_NAME_OLD)
  await knex.schema.renameTable(
    AUTOMATION_RUNS_TABLE_NAME_NEW,
    AUTOMATION_RUNS_TABLE_NAME_OLD
  )
  await knex.schema.renameTable(
    AUTOMATION_FUNCTION_RUNS_TABLE_NAME_NEW,
    AUTOMATION_FUNCTION_RUNS_TABLE_NAME_OLD
  )
  await knex.schema.renameTable(
    AUTOMATION_FUNCTION_RUNS_RESULT_VERSIONS_TABLE_NAME_NEW,
    AUTOMATION_FUNCTION_RUNS_RESULT_VERSIONS_TABLE_NAME_OLD
  )
}
