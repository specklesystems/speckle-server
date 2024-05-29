import { Knex } from 'knex'

const TABLE_NAME = 'automation_runs'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table(TABLE_NAME, (table) => {
    table.string('triggeredByUserId', 10).nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table(TABLE_NAME, (table) => {
    table.dropColumn('triggeredByUserId')
  })
}
