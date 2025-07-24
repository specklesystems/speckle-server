import type { Knex } from 'knex'

const FILEUPLOADS_TABLE = 'file_uploads'
const MESSAGE_FIELD = 'convertedMessage'

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    `ALTER TABLE ${FILEUPLOADS_TABLE} ALTER COLUMN "${MESSAGE_FIELD}" TYPE text;`
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    `ALTER TABLE ${FILEUPLOADS_TABLE} ALTER COLUMN "${MESSAGE_FIELD}" TYPE varchar(255);`
  )
}
