import { Knex } from 'knex'

const AUTOMATION_FUNCTION_RUNS_TABLE_NAME = 'automation_function_runs'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(AUTOMATION_FUNCTION_RUNS_TABLE_NAME, (table) => {
    table.string('functionName').defaultTo('majestic function').notNullable()
    table.text('functionLogo').defaultTo(null)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(AUTOMATION_FUNCTION_RUNS_TABLE_NAME, (table) => {
    table.dropColumns('functionName', 'functionLogo')
  })
}
