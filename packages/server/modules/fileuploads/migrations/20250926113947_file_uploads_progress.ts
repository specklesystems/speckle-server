import type { Knex } from 'knex'

const fileUploadTableName = 'file_uploads'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table(fileUploadTableName, (table) => {
    table.integer('convertedProgress').defaultTo(0)
    table.integer('convertedAttempt').defaultTo(0)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table(fileUploadTableName, (table) => {
    table.dropColumn('convertedProgress')
    table.dropColumn('convertedAttempt')
  })
}
