import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('object_children_closure', (table) => {
    table.primary(['streamId', 'parent', 'child'])
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('object_children_closure', (table) => {
    table.dropPrimary()
  })
}
