import type { Knex } from 'knex'

const TABLE_NAME = 'acc_sync_items'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropForeign('automationId')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    // Note: This will fail if any sync items have been created with `automationId` values that violate the constraint.
    // Handle those before running this migration.
    table
      .foreign('automationId')
      .references('id')
      .inTable('automations')
      .onDelete('cascade')
  })
}
