import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('stream_activity', (table) => {
    table.increments('id').primary()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('stream_activity', (table) => {
    table.dropColumn('id')
  })
}
