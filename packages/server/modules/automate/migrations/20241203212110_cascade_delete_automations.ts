import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('automation_revision_functions', (table) => {
    table.dropPrimary()
    table.dropForeign('automationRevisionId')
    table
      .foreign('automationRevisionId')
      .references('id')
      .inTable('automation_revisions')
      .onDelete('cascade')
    table.text('id').primary().notNullable().defaultTo(knex.raw('gen_random_uuid()'))
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('automation_revision_functions', (table) => {
    table.dropPrimary()
    table.dropForeign('automationRevisionId')
    table
      .foreign('automationRevisionId')
      .references('id')
      .inTable('automation_revisions')
      .onDelete('no action')
    table.primary(['automationRevisionId', 'functionId', 'functionReleaseId'])
  })
}
