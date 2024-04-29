import { Knex } from 'knex'

const AUTOMATION_FUNCTION_RUNS_TABLE = 'automation_function_runs'
const AUTOMATION_REVISION_FUNCTIONS_TABLE = 'automation_revision_functions'
const FUNCTIONS_TABLE = 'automate_functions'

export async function up(knex: Knex): Promise<void> {
  // TODO: Remove, this is a temporary shortcut to avoid messing up the db schema which makes it difficult to jump to different branches
  if (process.env.SKIP_AUTOMATE_MIGRATION_DEV) return

  await knex.schema.table(AUTOMATION_FUNCTION_RUNS_TABLE, (table) => {
    table.dropColumn('functionId')
  })

  await knex.schema.table(AUTOMATION_REVISION_FUNCTIONS_TABLE, (table) => {
    table.dropColumn('functionId')
  })
}

export async function down(knex: Knex): Promise<void> {
  // TODO: Remove, this is a temporary shortcut to avoid messing up the db schema which makes it difficult to jump to different branches
  if (process.env.SKIP_AUTOMATE_MIGRATION_DEV) return

  await knex.schema.table(AUTOMATION_FUNCTION_RUNS_TABLE, (table) => {
    table.text('functionId').notNullable()
    table.foreign('functionId').references('functionId').inTable(FUNCTIONS_TABLE)
  })

  await knex.schema.table(AUTOMATION_REVISION_FUNCTIONS_TABLE, (table) => {
    table.text('functionId').notNullable()
    table.foreign('functionId').references('functionId').inTable(FUNCTIONS_TABLE)
  })
}
