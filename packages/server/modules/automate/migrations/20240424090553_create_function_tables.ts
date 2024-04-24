import { Knex } from 'knex'

const FUNCTIONS_TABLE = 'automate_functions'
const FUNCTION_RELEASES_TABLE = 'automate_function_releases'
const AUTOMATION_REVISION_FUNCTIONS_TABLE = 'automation_revision_functions'
const AUTOMATION_FUNCTION_RUNS_TABLE = 'automation_function_runs'

export async function up(knex: Knex): Promise<void> {
  // TODO: Remove, this is a temporary shortcut to avoid messing up the db schema which makes it difficult to jump to different branches
  if (process.env.SKIP_AUTOMATE_MIGRATION_DEV) return

  // Functions table
  await knex.schema.createTable(FUNCTIONS_TABLE, (table) => {
    table.string('functionId').primary()
    table
      .string('userId')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('set null')
    table.text('repoUrl').notNullable()
    table.text('name').notNullable()
    table
      .timestamp('createdAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
    table
      .timestamp('updatedAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
    table.text('description').notNullable()
    table
      .specificType('tags', 'text[]')
      .defaultTo(knex.raw('ARRAY []::text[]'))
      .notNullable()
    table
      .specificType('supportedSourceApps', 'text[]')
      .defaultTo(knex.raw('ARRAY []::text[]'))
      .notNullable()
    table.boolean('isFeatured').defaultTo(false).notNullable()
    table.text('logo')
    table.text('executionEngineFunctionId').nullable().defaultTo(null)

    table.index('tags')
    table.index('supportedSourceApps')
  })

  // Function releases table
  await knex.schema.createTable(FUNCTION_RELEASES_TABLE, (table) => {
    table
      .string('functionId')
      .notNullable()
      .references('functionId')
      .inTable(FUNCTIONS_TABLE)
    table.string('functionReleaseId').primary()
    table.string('versionTag').notNullable()
    table.jsonb('inputSchema')
    table.specificType('command', 'text[]').notNullable()
    table
      .timestamp('createdAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
    table.string('gitCommitId').notNullable()
  })

  // Add fk to functions & releases in automation_revision_functions
  await knex.schema.alterTable(AUTOMATION_REVISION_FUNCTIONS_TABLE, (table) => {
    table.foreign('functionId').references('functionId').inTable(FUNCTIONS_TABLE)
    table
      .foreign('functionReleaseId')
      .references('functionReleaseId')
      .inTable(FUNCTION_RELEASES_TABLE)
  })

  // Add fk to functions & releases in automation_function_runs
  await knex.schema.alterTable(AUTOMATION_FUNCTION_RUNS_TABLE, (table) => {
    table.foreign('functionId').references('functionId').inTable(FUNCTIONS_TABLE)
    table
      .foreign('functionReleaseId')
      .references('functionReleaseId')
      .inTable(FUNCTION_RELEASES_TABLE)
  })
}

export async function down(knex: Knex): Promise<void> {
  // TODO: Remove, this is a temporary shortcut to avoid messing up the db schema which makes it difficult to jump to different branches
  if (process.env.SKIP_AUTOMATE_MIGRATION_DEV) return

  await knex.schema.alterTable(AUTOMATION_REVISION_FUNCTIONS_TABLE, (table) => {
    table.dropForeign(['functionId'])
    table.dropForeign(['functionReleaseId'])
  })
  await knex.schema.alterTable(AUTOMATION_FUNCTION_RUNS_TABLE, (table) => {
    table.dropForeign(['functionId'])
    table.dropForeign(['functionReleaseId'])
  })

  await knex.schema.dropTable(FUNCTION_RELEASES_TABLE)
  await knex.schema.dropTable(FUNCTIONS_TABLE)
}
