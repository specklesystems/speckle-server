import { Knex } from 'knex'

const FUNCTION_RELEASES_TABLE = 'automate_function_releases'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(FUNCTION_RELEASES_TABLE, (table) => {
    table.integer('recommendedCPUm').notNullable()
    table.integer('recommendedMemoryMi').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(FUNCTION_RELEASES_TABLE, (table) => {
    table.dropColumn('recommendedCPUm')
    table.dropColumn('recommendedMemoryMi')
  })
}
