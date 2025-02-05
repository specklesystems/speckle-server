import { Knex } from 'knex'

const TABLE_NAME = 'regions'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.string('key').primary()
    table.string('name').notNullable()
    table.text('description').nullable()

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
  await knex.schema.dropTable(TABLE_NAME)
}
