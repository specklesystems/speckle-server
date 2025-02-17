import { Knex } from 'knex'

const TABLE_NAME = 'automation_function_runs'

export async function up(knex: Knex): Promise<void> {
  // make function run results nullable
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.jsonb('results').nullable().alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex(TABLE_NAME).whereNull('results').update({ results: '{}' })
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.jsonb('results').notNullable().alter()
  })
}
