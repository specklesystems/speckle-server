import { Knex } from 'knex'

const REVISIONS_TABLE_NAME = 'automation_revisions'

export async function up(knex: Knex): Promise<void> {
  // TODO: Remove, this is a temporary shortcut to avoid messing up the db schema which makes it difficult to jump to different branches
  if (process.env.SKIP_AUTOMATE_MIGRATION_DEV) return

  await knex.schema.alterTable(REVISIONS_TABLE_NAME, (table) => {
    table.boolean('active').notNullable().defaultTo(false)
  })
}

export async function down(knex: Knex): Promise<void> {
  // TODO: Remove, this is a temporary shortcut to avoid messing up the db schema which makes it difficult to jump to different branches
  if (process.env.SKIP_AUTOMATE_MIGRATION_DEV) return

  await knex.schema.alterTable(REVISIONS_TABLE_NAME, (table) => {
    table.dropColumn('active')
  })
}
