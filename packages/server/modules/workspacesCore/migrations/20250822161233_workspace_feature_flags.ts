import { type Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('workspace_plans', (table) => {
    table.bigInteger('featureFlags').notNullable().defaultTo(0)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('workspace_plans', (table) => {
    table.dropColumn('featureFlags')
  })
}
