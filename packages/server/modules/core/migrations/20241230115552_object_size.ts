import { Knex } from 'knex'

const TABLE_NAME = 'objects'
const COL_NAME = 'sizeBytes'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.bigInteger(COL_NAME).nullable().defaultTo(null)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn(COL_NAME)
  })
}
