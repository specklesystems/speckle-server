import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('automation_function_runs', (table) => {
    table.float('progress').notNullable().defaultTo(0)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('automation_function_runs', (table) => {
    table.dropColumn('progress')
  })
}

