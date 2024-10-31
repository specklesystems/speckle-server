import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('user_sso_sessions', (table) => {
    table.dropColumn('lifespan')
    table
      .timestamp('validUntil', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  const lifespan = 6.048e8 // 1 week
  await knex.schema.alterTable('user_sso_sessions', (table) => {
    table.dropColumn('createdAt')
    table.bigint('lifespan').defaultTo(lifespan).notNullable()
  })
}
