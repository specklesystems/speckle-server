import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('workspace_plans', (table) => {
    table
      .timestamp('createdAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('workspace_plans', (table) => {
    table.dropColumn('createdAt')
  })
}
