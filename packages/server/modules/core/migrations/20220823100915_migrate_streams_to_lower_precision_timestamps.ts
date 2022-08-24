import { Knex } from 'knex'

/**
 * MIGRATING STREAMS TIMESTAMP FIELDS TO A LOWER PRECISION, CAUSE JS CANT HANDLE
 * IT BEING THAT HIGH AND THIS GENERATES BUGS
 */

const TABLE_NAME = 'streams'
const TIMESTAMP_COLUMNS = ['createdAt', 'updatedAt']

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    TIMESTAMP_COLUMNS.forEach((col) => {
      table
        .timestamp(col, { precision: 3, useTz: true })
        .defaultTo(knex.fn.now())
        .alter()
    })
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    TIMESTAMP_COLUMNS.forEach((col) => {
      table
        .timestamp(col, { precision: 6, useTz: true })
        .defaultTo(knex.fn.now())
        .alter()
    })
  })
}
