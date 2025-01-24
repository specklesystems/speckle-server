import { Knex } from 'knex'

const TABLE_NAME = 'email_verifications'

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    `ALTER TABLE ${TABLE_NAME} DROP CONSTRAINT IF EXISTS email_verifications_email_unique`
  )
}

export async function down(): Promise<void> {}
