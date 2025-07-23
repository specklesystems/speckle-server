import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('automations', (table) => {
    table.boolean('isDeleted').notNullable().defaultTo(false)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('automations', (table) => {
    table.dropColumn('isDeleted')
  })
}
