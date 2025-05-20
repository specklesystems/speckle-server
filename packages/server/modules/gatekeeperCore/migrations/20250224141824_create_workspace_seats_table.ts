import { Knex } from 'knex'

const WORKSPACE_SEATS_TABLE = 'workspace_seats'
const WORKSPACES_TABLE = 'workspaces'
const USERS_TABLE = 'users'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(WORKSPACE_SEATS_TABLE, (table) => {
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
    table.text('type').notNullable()
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
  await knex.schema.dropTable(WORKSPACE_SEATS_TABLE)
}
