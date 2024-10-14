import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('workspace_domains', (table) => {
    table.text('id').primary()
    table.text('domain').notNullable()
    table.boolean('verified').notNullable()
    table.timestamp('createdAt', { precision: 3, useTz: true }).notNullable()
    table.timestamp('updatedAt', { precision: 3, useTz: true }).notNullable()
    table.text('createdByUserId').references('id').inTable('users').onDelete('set null')
    table.text('workspaceId').references('id').inTable('workspaces').onDelete('cascade')
    table.unique(['workspaceId', 'domain'])
    table.index('workspaceId')
    table.index('domain')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('workspace_domains')
}
