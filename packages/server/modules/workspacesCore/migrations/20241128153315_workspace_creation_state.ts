import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('workspace_creation_state', (table) => {
    table
      .text('workspaceId')
      .primary()
      .references('id')
      .inTable('workspaces')
      .onDelete('cascade')
    table.boolean('completed').notNullable()
    table.jsonb('state').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('workspace_creation_state')
}
