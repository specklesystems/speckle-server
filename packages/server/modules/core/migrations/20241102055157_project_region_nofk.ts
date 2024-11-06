import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('streams', (table) => {
    table.dropForeign('regionKey')
  })
}

export async function down(): Promise<void> {
  // im not providing a down here, it was a mistake to have that FK
}
