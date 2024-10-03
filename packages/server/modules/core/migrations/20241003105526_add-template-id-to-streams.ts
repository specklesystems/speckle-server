import { Knex } from 'knex'

const TABLE_NAME = 'streams'
const COL_NAME = 'templateId'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.text(COL_NAME).defaultTo(null)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn(COL_NAME)
  })
}
