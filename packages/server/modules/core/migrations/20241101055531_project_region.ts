import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('streams', (table) => {
    table
      .text('regionKey')
      .references('key')
      .inTable('regions')
      .nullable()
      .defaultTo(null)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('streams', (table) => {
    table.dropColumn('regionKey')
  })
}
