import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('workspace_acl', (table) => {
    table.timestamp('createdAt', { precision: 3, useTz: true }).notNullable()
    table.timestamp('updatedAt', { precision: 3, useTz: true }).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('workspace_acl', (table) => {
    table.dropColumn('createdAt')
    table.dropColumn('updatedAt')
  })
}
