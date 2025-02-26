import { Knex } from 'knex'

const WORKSPACE_JOIN_REQUESTS_TABLE = 'workspace_join_requests'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(WORKSPACE_JOIN_REQUESTS_TABLE, (table) => {
    table.index('userId')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(WORKSPACE_JOIN_REQUESTS_TABLE, (table) => {
    table.dropIndex('userId')
  })
}
