import type { Knex } from 'knex'

const TABLE_NAME = 'user_notifications'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.string('id').primary()
    table.string('type').notNullable()
    table.boolean('read').notNullable()
    table
      .string('userId', 10)
      .primary()
      .references('id')
      .inTable('users')
      .onDelete('cascade')
    table.jsonb('payload').notNullable()
    table.timestamp('sendEmailAt', { precision: 3, useTz: true }).nullable()
    table.timestamp('createdAt', { precision: 3, useTz: true }).defaultTo(knex.fn.now())
    table.timestamp('updatedAt', { precision: 3, useTz: true }).defaultTo(knex.fn.now())

    table.index(['userId', 'createdAt'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TABLE_NAME)
}
