import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('comment_links', (table) => {
    table.primary(['commentId', 'resourceId', 'resourceType'])
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('comment_links', (table) => {
    table.dropPrimary()
  })
}
