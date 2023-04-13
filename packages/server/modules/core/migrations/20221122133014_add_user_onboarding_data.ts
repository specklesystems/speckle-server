import { Knex } from 'knex'

const TABLE_NAME = 'users'
const COL_NAME = 'isOnboardingFinished'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.boolean(COL_NAME).defaultTo(false).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn(COL_NAME)
  })
}
