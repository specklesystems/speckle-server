import { Knex } from 'knex'

const AUTOMATIONS_TABLE_NAME = 'automations'
const REVISIONS_TABLE_NAME = 'automation_revisions'
const REVISION_FUNCTIONS_TABLE_NAME = 'automation_revision_functions'
const AUTOMATION_RUNS_TABLE_NAME = 'automation_runs'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(AUTOMATIONS_TABLE_NAME, (table) => {
    table.text('id').primary({ constraintName: 'automation_id_pk' })
    table.text('name').notNullable()
    // TODO: this is removing the cost item !!
    table.text('projectId').references('id').inTable('streams').onDelete('cascade')
    // table.text('modelId').references('id').inTable('branches').onDelete('cascade')
    table.boolean('enabled').notNullable()
    table
      .timestamp('createdAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
    table
      .timestamp('updatedAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()

    table.index('projectId')
  })
  await knex.schema.createTable(REVISIONS_TABLE_NAME, (table) => {
    table.text('id').primary()
    table
      .text('automationId')
      .references('id')
      .inTable(AUTOMATIONS_TABLE_NAME)
      .onDelete('cascade')
    table.boolean('published').notNullable()
    table.jsonb('triggers').notNullable() // { "triggers": [{ "modelId": "asdf", "type": "commit"}...]}
    // table.jsonb('triggers').notNullable() // { "triggers": [{ "modelId": "asdf", "versionId": "asdf", "type": "commit"}...]}
    table
      .timestamp('createdAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()

    table.index('automationId')
  })
  await knex.schema.createTable(REVISION_FUNCTIONS_TABLE_NAME, (table) => {
    table.text('automationRevisionId').references('id').inTable(REVISIONS_TABLE_NAME)
    table.text('functionId').notNullable()
    table.text('functionReleaseId').notNullable()
    table.jsonb('functionInputs').nullable()

    table.primary(['automationRevisionId', 'functionId', 'functionReleaseId'])
  })

  await knex.schema.createTable(AUTOMATION_RUNS_TABLE_NAME, (table) => {
    table.text('id').primary({ constraintName: 'automation_runs_primary' })
    table
      .text('automationId')
      .notNullable()
      .references('id')
      .inTable(AUTOMATIONS_TABLE_NAME)
      .onDelete('cascade')
    table
      .text('automationRevisionId')
      .notNullable()
      .references('id')
      .inTable(REVISIONS_TABLE_NAME)
      .onDelete('cascade')
    table
      .timestamp('createdAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
    table
      .timestamp('updatedAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
    table
      .text('versionId')
      .notNullable()
      .references('id')
      .inTable('commits')
      .onDelete('cascade')

    table.string('status').notNullable()
    table.jsonb('functionRuns').notNullable() // schema defined in code
    table.jsonb('triggers').notNullable() // { "triggers": [{ "modelId": "asdf", "versionId": "asdf", "triggerType": "versionCreation"}...]}
    // table.jsonb('rawInputPayload').notNullable() // TODO: do we need this for easy reruns?

    table.index(['automationId', 'automationRevisionId'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(AUTOMATION_RUNS_TABLE_NAME)
  await knex.schema.dropTable(REVISION_FUNCTIONS_TABLE_NAME)
  await knex.schema.dropTable(REVISIONS_TABLE_NAME)
  await knex.schema.dropTable(AUTOMATIONS_TABLE_NAME)
}
