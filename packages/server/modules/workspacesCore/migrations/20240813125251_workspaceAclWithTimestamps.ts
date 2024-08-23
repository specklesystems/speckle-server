import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('workspace_acl_updates', (table) => {
    table.text('id').primary()
    table.text('userId').references('id').inTable('users').onDelete('cascade')
    table.text('workspaceId').references('id').inTable('workspaces').onDelete('cascade')
    table
      .text('role')
      .references('name')
      .inTable('user_roles')
      .notNullable()
      .onDelete('cascade')
    table
      .timestamp('updatedAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('workspace_acl_updates')
}
