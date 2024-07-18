import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_emails', (table) => {
    table.string('id').notNullable().primary()
    table.string('email').notNullable()
    table.boolean('primary').defaultTo(false)
    table.boolean('verified').defaultTo(false)
    table
      .string('userId')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('cascade')
    table
      .timestamp('createdAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
    table
      .timestamp('updatedAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
    table.unique(['userId', 'email'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('user_emails')
}
