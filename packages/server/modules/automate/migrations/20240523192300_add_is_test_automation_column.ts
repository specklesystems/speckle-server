import { Knex } from 'knex'

const AUTOMATIONS_TABLE = 'automations'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(AUTOMATIONS_TABLE, (table) => {
    table.boolean('isTestAutomation').notNullable().defaultTo(false)
  })

  await knex.schema.alterTable(AUTOMATIONS_TABLE, (table) => {
    table.setNullable('executionEngineAutomationId')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex(AUTOMATIONS_TABLE).where('isTestAutomation', true).delete()

  await knex.schema.alterTable(AUTOMATIONS_TABLE, (table) => {
    table.dropColumn('isTestAutomation')
  })

  await knex.schema.alterTable(AUTOMATIONS_TABLE, (table) => {
    table.string('executionEngineAutomationId').notNullable().alter()
  })
}
