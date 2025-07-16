import { Knex } from 'knex'

const fileUploadTableName = 'file_uploads'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(fileUploadTableName, (table) => {
    table.float('durationSeconds').defaultTo(null)
    table.float('downloadDurationSeconds').defaultTo(null)
    table.float('parseDurationSeconds').defaultTo(null)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(fileUploadTableName, (table) => {
    table.dropColumn('durationSeconds')
    table.dropColumn('downloadDurationSeconds')
    table.dropColumn('parseDurationSeconds')
  })
}
