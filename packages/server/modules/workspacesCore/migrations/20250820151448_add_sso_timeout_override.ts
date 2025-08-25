import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('sso_providers', (table) => {
    table.integer('sessionTimeoutDays').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('sso_providers', (table) => {
    table.dropColumn('sessionTimeoutDays')
  })
}
