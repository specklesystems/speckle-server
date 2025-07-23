import type { Knex } from 'knex'

const TABLE_NAME = 'webhooks_config'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.table(TABLE_NAME, (table) => {
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
  await knex.schema.table(TABLE_NAME, (table) => {
    table.dropColumn('createdAt')
    table.dropColumn('updatedAt')
  })
}
