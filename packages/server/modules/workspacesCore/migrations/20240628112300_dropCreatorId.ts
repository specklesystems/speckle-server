import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('workspaces', (table) => {
    table.dropColumn('createdByUserId')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('workspaces', (table) => {
    table.text('createdByUserId').references('id').inTable('users').onDelete('set null')
  })
}
