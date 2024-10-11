import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('streams', (table) => {
    table.dropForeign('workspaceId')
    table
      .foreign('workspaceId')
      .references('id')
      .inTable('workspaces')
      .onDelete('cascade')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('streams', (table) => {
    table.dropForeign('workspaceId')
    table
      .foreign('workspaceId')
      .references('id')
      .inTable('workspaces')
      .onDelete('NO ACTION')
  })
}
