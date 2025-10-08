import type { Knex } from 'knex'

const JOB_TABLE_NAME = 'background_jobs'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTableIfNotExists(JOB_TABLE_NAME, (table) => {
    table.text('id').primary()
    table.text('jobType').notNullable().index()
    table.jsonb('payload').notNullable()
    table.text('status').notNullable().index()
    table.text('originServerUrl').notNullable()
    table.integer('timeoutMs').notNullable()
    table.integer('attempt').notNullable()
    table.integer('maxAttempt').notNullable()
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
  await knex.schema.dropTableIfExists(JOB_TABLE_NAME)
}
