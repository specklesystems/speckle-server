import { Knex } from 'knex'

const TABLE_NAME = 'branches'

export async function up(knex: Knex): Promise<void> {
  // delete all invalid branches (null name - shouldnt even exist)
  await knex.table(TABLE_NAME).whereNull('name').del()

  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.string('name', 512).notNullable().alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.string('name', 512).nullable().alter()
  })
}
