import { Knex } from 'knex'

const AUTOMATIONS_TABLE_NAME = 'automations'
const AUTOMATION_RUNS_TABLE_NAME = 'automation_runs'

const AUTOMATION_ID = 'automationId'
const AUTOMATION_REVISION_ID = 'automationRevisionId'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(AUTOMATIONS_TABLE_NAME, (table) => {
    table.string(AUTOMATION_ID).notNullable
    table.string(AUTOMATION_REVISION_ID).notNullable()
    table.string('automationName').notNullable()
    table.string('projectId').notNullable().references('id').inTable('streams')
    table.string('modelId').notNullable()
    table
      .timestamp('createdAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
    table.primary([AUTOMATION_ID, AUTOMATION_REVISION_ID])
  })
  await knex.schema.createTable(AUTOMATION_RUNS_TABLE_NAME, (table) => {
    table.string(AUTOMATION_ID).notNullable()
    table.string(AUTOMATION_REVISION_ID).notNullable()
    table
      .string('versionId')
      .references('id')
      .inTable('commits')
      .notNullable()
      .onDelete('cascade')
    table.string('automationRunId').primary()
    table
      .timestamp('createdAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
    table
      .timestamp('updatedAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
    table.jsonb('data')
    table
      .foreign([AUTOMATION_ID, AUTOMATION_REVISION_ID])
      .references([AUTOMATION_ID, AUTOMATION_REVISION_ID])
      .inTable(AUTOMATIONS_TABLE_NAME)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(AUTOMATION_RUNS_TABLE_NAME)
  await knex.schema.dropTableIfExists(AUTOMATIONS_TABLE_NAME)
}
