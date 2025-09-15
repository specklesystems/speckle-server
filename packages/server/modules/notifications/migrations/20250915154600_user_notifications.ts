import type { Knex } from 'knex'

const TABLE_NAME = 'user_notifications'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.string('id').primary()
    table.string('notificationType').notNullable()
    table.boolean('read').notNullable()
    table
      .string('userId', 10)
      .primary()
      .references('id')
      .inTable('users')
      .onDelete('cascade')
    table.jsonb('payload').notNullable()
    table.timestamp('sendEmailAt').nullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now())
    table.timestamp('updatedAt').defaultTo(knex.fn.now())
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TABLE_NAME)
}
