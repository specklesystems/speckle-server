import { Knex } from 'knex'

const REVISIONS_TABLE_NAME = 'automation_revisions'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(REVISIONS_TABLE_NAME, (table) => {
    table.boolean('active').notNullable().defaultTo(false)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(REVISIONS_TABLE_NAME, (table) => {
    table.dropColumn('active')
  })
}
