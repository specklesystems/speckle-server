import { Knex } from "knex";

const AUTOMATIONS_NAME = 'automations'
const AUTOMATION_TEMPLATES_NAME = 'automation_templates'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(AUTOMATION_TEMPLATES_NAME, (table) => {
    table.string('id').primary()
    table.string('name').notNullable()
    table.string('workspaceId').notNullable().references('id').inTable('workspaces').onDelete('cascade')
    table.boolean('enableAutoCreate').notNullable().defaultTo(true)
    table
      .timestamp('createdAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
    table
      .timestamp('updatedAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
    table.string('functionId').notNullable()
    table.string('functionReleaseId').notNullable()
    table.string('functionInputs').notNullable()
  })
  await knex.schema.alterTable(AUTOMATIONS_NAME, (table) => {
    table.string('templateId').nullable().references('id').inTable(AUTOMATION_TEMPLATES_NAME).onDelete('SET NULL')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(AUTOMATION_TEMPLATES_NAME)
  await knex.schema.alterTable(AUTOMATIONS_NAME, (table) => {
    table.dropColumn('templateId')
  })
}
