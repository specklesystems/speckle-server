import { Knex } from 'knex'

const AUTOMATIONS_TABLE_NAME = 'automations'
const AUTOMATION_RUNS_TABLE_NAME = 'automation_runs'
const WEBHOOKS_TABLE_NAME = 'webhooks_config'
const STREAMS_TABLE_NAME = 'streams'

const AUTOMATION_ID = 'automationId'
const AUTOMATION_REVISION_ID = 'automationRevisionId'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(AUTOMATIONS_TABLE_NAME, (table) => {
    // Update automations table projectId foreign key to cascade on delete
    table.dropForeign('projectId')
    table
      .foreign('projectId')
      .references('id')
      .inTable(STREAMS_TABLE_NAME)
      .onDelete('cascade')

    // Set webhookId to null on delete
    table.dropForeign('webhookId')
    table
      .foreign('webhookId')
      .references('id')
      .inTable(WEBHOOKS_TABLE_NAME)
      .onDelete('set null')
  })

  // Update automation_runs table automationId foreign key to cascade on delete
  await knex.schema.alterTable(AUTOMATION_RUNS_TABLE_NAME, (table) => {
    table.dropForeign([AUTOMATION_ID, AUTOMATION_REVISION_ID])
    table
      .foreign([AUTOMATION_ID, AUTOMATION_REVISION_ID])
      .references([AUTOMATION_ID, AUTOMATION_REVISION_ID])
      .inTable(AUTOMATIONS_TABLE_NAME)
      .onDelete('cascade')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(AUTOMATIONS_TABLE_NAME, (table) => {
    table.dropForeign('projectId')
    table.foreign('projectId').references('id').inTable(STREAMS_TABLE_NAME)

    table.dropForeign('webhookId')
    table.foreign('webhookId').references('id').inTable(WEBHOOKS_TABLE_NAME)
  })

  await knex.schema.alterTable(AUTOMATION_RUNS_TABLE_NAME, (table) => {
    table.dropForeign([AUTOMATION_ID, AUTOMATION_REVISION_ID])
    table
      .foreign([AUTOMATION_ID, AUTOMATION_REVISION_ID])
      .references([AUTOMATION_ID, AUTOMATION_REVISION_ID])
      .inTable(AUTOMATIONS_TABLE_NAME)
  })
}
