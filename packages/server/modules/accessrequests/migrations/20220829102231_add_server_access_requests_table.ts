import { Knex } from 'knex'

const TABLE_NAME = 'server_access_requests'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.string('id', 10)
    table
      .string('requesterId', 10)
      .references('id')
      .inTable('users')
      .onDelete('cascade')
      .notNullable()

    table.string('resourceType').notNullable()
    table.string('resourceId').nullable()

    table
      .timestamp('createdAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
    table
      .timestamp('updatedAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()

    table.primary(['id'])
    table.index(['resourceType', 'resourceId'])
    table.unique(['requesterId', 'resourceId', 'resourceType'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists(TABLE_NAME)
}
