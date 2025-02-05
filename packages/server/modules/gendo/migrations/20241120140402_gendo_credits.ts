import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('gendo_user_credits', (table) => {
    table
      .string('userId')
      .primary()
      .references('id')
      .inTable('users')
      .onDelete('cascade')
    table.timestamp('resetDate', { precision: 3, useTz: true }).notNullable()
    table.integer('used').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('gendo_user_credits')
}
