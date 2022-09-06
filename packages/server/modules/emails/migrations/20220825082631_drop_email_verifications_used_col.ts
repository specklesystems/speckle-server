import { Knex } from 'knex'

const TABLE_NAME = 'email_verifications'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn('used')
    table
      .timestamp('createdAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.boolean('used').defaultTo(false)
    table
      .timestamp('createdAt', { precision: 6, useTz: true })
      .defaultTo(knex.fn.now())
      .alter()
  })
}
