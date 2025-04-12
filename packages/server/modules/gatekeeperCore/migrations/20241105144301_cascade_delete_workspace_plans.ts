import { Knex } from 'knex'

const TABLE_NAME = 'workspace_plans'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropForeign(['workspaceId'])
    table
      .foreign('workspaceId')
      .references('id')
      .inTable('workspaces')
      .onDelete('CASCADE')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropForeign(['workspaceId'])
    table.foreign('workspaceId').references('id').inTable('workspaces')
  })
}
