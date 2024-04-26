import { Knex } from 'knex'

const AUTOMATE_FUNCTION_TOKENS_TABLE = 'automate_function_tokens'
const AUTOMATE_FUNCTIONS_TABLE = 'automate_functions'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(AUTOMATE_FUNCTION_TOKENS_TABLE, (table) => {
    table
      .string('functionId')
      .notNullable()
      .references('functionId')
      .inTable(AUTOMATE_FUNCTIONS_TABLE)
    table.string('token').notNullable()
    table
      .timestamp('createdAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
    table
      .timestamp('updatedAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()

    table.primary(['functionId'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(AUTOMATE_FUNCTION_TOKENS_TABLE)
}
