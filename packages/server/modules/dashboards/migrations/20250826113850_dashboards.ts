import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('dashboards', (table) => {
    table.text('id').primary()
    table.text('name').notNullable()
    table
      .text('workspaceId')
      .notNullable()
      .references('id')
      .inTable('workspaces')
      .onDelete('cascade')
    table.text('ownerId').references('id').inTable('users').onDelete('set null')
    table.specificType('projectIds', 'text[]').notNullable().defaultTo('{}')
    table.text('state').nullable()
    table.timestamp('createdAt', { precision: 3, useTz: true }).notNullable()
    table.timestamp('updatedAt', { precision: 3, useTz: true }).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('dashboards')
}
