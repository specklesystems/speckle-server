import { Knex } from 'knex'

const TABLE_NAME = 'server_invites'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table
      .timestamp('updatedAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
  })

  // set updatedAt to be same value as createdAt
  await knex(TABLE_NAME).update({ updatedAt: knex.raw('??', ['createdAt']) })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn('updatedAt')
  })
}
