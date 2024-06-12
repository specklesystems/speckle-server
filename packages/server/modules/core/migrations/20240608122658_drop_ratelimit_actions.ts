import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('ratelimit_actions')
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists('ratelimit_actions', (table) => {
    table.timestamp('timestamp').defaultTo(knex.fn.now())
    table.string('action').notNullable()
    table.string('source').notNullable()
    table.index(['source', 'action', 'timestamp'], 'ratelimit_query_idx')
  })
}
