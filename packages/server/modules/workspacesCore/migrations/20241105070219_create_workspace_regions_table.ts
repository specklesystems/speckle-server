import { Knex } from 'knex'

const WORKSPACES_TABLE = 'workspaces'
const REGIONS_TABLE = 'regions'
const WORKSPACE_REGIONS_TABLE = 'workspace_regions'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(WORKSPACE_REGIONS_TABLE, (table) => {
    table
      .text('workspaceId')
      .references('id')
      .inTable(WORKSPACES_TABLE)
      .onDelete('cascade')
      .notNullable()
    table
      .string('regionKey')
      .references('key')
      .inTable(REGIONS_TABLE)
      .onDelete('cascade')
      .notNullable()
    table
      .timestamp('createdAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()

    table.primary(['workspaceId', 'regionKey'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(WORKSPACE_REGIONS_TABLE)
}
