import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('activity', (table) => {
    table.string('id', 10).primary()
    table.string('contextResourceId').notNullable()
    table.string('contextResourceType').notNullable()
    table.string('eventType').notNullable()
    table.string('userId')
    table.jsonb('payload').notNullable()
    table.timestamp('createdAt').defaultTo(knex.fn.now())

    table.index('eventType')
    table.index('contextResourceId')
    table.index('createdAt')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('activity')
}
