import type { Knex } from 'knex'

const tableName = 'users_meta'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(tableName, (table) => {
    table
      .string('userId', 10)
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('cascade')

    table.string('key').notNullable()
    table.json('value')

    table
      .timestamp('createdAt', { precision: 3, useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now())
    table
      .timestamp('updatedAt', { precision: 3, useTz: true })
      .notNullable()
      .defaultTo(knex.fn.now())

    table.primary(['userId', 'key'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(tableName)
}
