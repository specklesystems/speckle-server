import { Knex } from 'knex'

const AUTOMATIONS_TABLE = 'automations'
const PLACEHOLDER_NULL_ID = 'null-execution-engine-automation-id'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(AUTOMATIONS_TABLE, (table) => {
    table.boolean('isTestAutomation').notNullable().defaultTo(false)
  })

  await knex.schema.alterTable(AUTOMATIONS_TABLE, (table) => {
    table.setNullable('executionEngineAutomationId')
  })

  await knex(AUTOMATIONS_TABLE)
    .where('executionEngineAutomationId', PLACEHOLDER_NULL_ID)
    .update({ executionEngineAutomationId: null })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(AUTOMATIONS_TABLE, (table) => {
    table.dropColumn('isTestAutomation')
  })

  await knex(AUTOMATIONS_TABLE)
    .whereNull('executionEngineAutomationId')
    .update({ executionEngineAutomationId: PLACEHOLDER_NULL_ID })

  await knex.schema.alterTable(AUTOMATIONS_TABLE, (table) => {
    table.string('executionEngineAutomationId').notNullable().alter()
  })
}
