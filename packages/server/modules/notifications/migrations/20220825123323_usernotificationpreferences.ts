import { Knex } from 'knex'

const TABLE_NAME = 'user_notification_preferences'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table
      .string('userId', 10)
      .primary()
      .references('id')
      .inTable('users')
      .onDelete('cascade')
    table.jsonb('preferences').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TABLE_NAME)
}
