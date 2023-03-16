import { Knex } from 'knex'

const TABLE_NAME = 'users'
const COL_NAME = 'isOnboardingFinished'

export async function up(knex: Knex): Promise<void> {
  // for some reason doesn't exist in tests sometime?
  const hasCol = await knex.schema.hasColumn(TABLE_NAME, COL_NAME)
  if (!hasCol) return

  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn(COL_NAME)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.boolean(COL_NAME).defaultTo(false).notNullable()
  })
}
