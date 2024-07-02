import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('workspaces', (table) => {
    table.text('id').primary()
    table.text('name').notNullable()
    table.text('description')
    table.timestamp('createdAt', { precision: 3, useTz: true }).notNullable()
    table.timestamp('updatedAt', { precision: 3, useTz: true }).notNullable()
    table.text('createdByUserId').references('id').inTable('users').onDelete('set null')
    table.text('logoUrl')
  })
  await knex.schema.alterTable('streams', (table) => {
    table.string('workspaceId').references('id').inTable('workspaces')
  })
  await knex.schema.createTable('workspace_acl', (table) => {
    table.text('userId').references('id').inTable('users').onDelete('cascade')
    table.text('workspaceId').references('id').inTable('workspaces').onDelete('cascade')
    table.primary(['userId', 'workspaceId'])
    table
      .text('role')
      .references('name')
      .inTable('user_roles')
      .notNullable()
      .onDelete('cascade')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('streams', (table) => {
    table.dropColumn('workspaceId')
  })
  await knex.schema.dropTable('workspace_acl')
  await knex.schema.dropTable('workspaces')
}
