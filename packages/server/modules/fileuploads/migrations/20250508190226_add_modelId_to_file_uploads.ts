import type { Knex } from 'knex'

const fileUploadTableName = 'file_uploads'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(fileUploadTableName, (table) => {
    table.string('modelId')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(fileUploadTableName, (table) => {
    table.dropColumn('modelId')
  })
}
