import type { Knex } from 'knex'

const TABLE_NAME = 'file_uploads'
const METADATA_FIELD = 'metadata'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table(TABLE_NAME, (table) => {
    table.dropColumn(METADATA_FIELD)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table(TABLE_NAME, (table) => {
    table.json(METADATA_FIELD).nullable().defaultTo(null)
  })
}
