import { Knex } from 'knex'

const USERS_TABLE = 'users'
const WORKSPACES_TABLE = 'workspaces'
const WORKSPACE_JOIN_REQUESTS_TABLE = 'workspace_join_requests'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(WORKSPACE_JOIN_REQUESTS_TABLE, (table) => {
    table
      .text('workspaceId')
      .references('id')
      .inTable(WORKSPACES_TABLE)
      .onDelete('cascade')
      .notNullable()
    table
      .text('userId')
      .references('id')
      .inTable(USERS_TABLE)
      .onDelete('cascade')
      .notNullable()
    table.text('status').notNullable()
    table
      .timestamp('createdAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
    table
      .timestamp('updatedAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()

    table.primary(['workspaceId', 'userId'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(WORKSPACE_JOIN_REQUESTS_TABLE)
}
