import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('workspaces', (table) => {
    table
      .timestamp('deleteAfter', { precision: 3, useTz: true })
      .nullable()
      .defaultTo(null)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('workspaces', (table) => {
    table.dropColumn('deleteAfter')
  })
}
