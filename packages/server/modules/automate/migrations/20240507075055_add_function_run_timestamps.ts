import { Knex } from 'knex'

const TABLE_NAME = 'automation_function_runs'

export async function up(knex: Knex): Promise<void> {
  // TODO: Remove, this is a temporary shortcut to avoid messing up the db schema which makes it difficult to jump to different branches
  if (process.env.SKIP_AUTOMATE_MIGRATION_DEV) return

  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table
      .timestamp('createdAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
    table
      .timestamp('updatedAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  // TODO: Remove, this is a temporary shortcut to avoid messing up the db schema which makes it difficult to jump to different branches
  if (process.env.SKIP_AUTOMATE_MIGRATION_DEV) return

  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn('createdAt')
    table.dropColumn('updatedAt')
  })
}
