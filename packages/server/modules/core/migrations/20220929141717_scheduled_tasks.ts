import { Knex } from 'knex'

const TABLE_NAME = 'scheduled_tasks'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.string('taskName').primary()
    table.timestamp('lockExpiresAt', { precision: 3, useTz: true }).notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TABLE_NAME)
}
