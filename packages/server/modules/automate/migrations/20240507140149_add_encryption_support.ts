import type { Knex } from 'knex'

const AUTOMATION_REVISIONS_TABLE = 'automation_revisions'
const AUTOMATION_REVISION_FUNCTIONS_TABLE = 'automation_revision_functions'

export async function up(knex: Knex): Promise<void> {
  // cleaning up old data (there shouldn't be any) so that publickey doesn't have to be nullable etc.
  await knex.delete().from(AUTOMATION_REVISION_FUNCTIONS_TABLE)
  await knex.delete().from(AUTOMATION_REVISIONS_TABLE)

  await knex.schema.alterTable(AUTOMATION_REVISIONS_TABLE, (table) => {
    table.string('publicKey').notNullable()
  })

  await knex.schema.alterTable(AUTOMATION_REVISION_FUNCTIONS_TABLE, (table) => {
    table.dropColumn('functionInputs')
  })

  await knex.schema.alterTable(AUTOMATION_REVISION_FUNCTIONS_TABLE, (table) => {
    table.text('functionInputs').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(AUTOMATION_REVISIONS_TABLE, (table) => {
    table.dropColumn('publicKey')
  })

  await knex.schema.alterTable(AUTOMATION_REVISION_FUNCTIONS_TABLE, (table) => {
    table.dropColumn('functionInputs')
  })

  await knex.schema.alterTable(AUTOMATION_REVISION_FUNCTIONS_TABLE, (table) => {
    table.jsonb('functionInputs').nullable()
  })
}
