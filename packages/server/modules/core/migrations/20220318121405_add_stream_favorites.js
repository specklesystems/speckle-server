/* istanbul ignore file */

const TABLE_NAME = 'stream_favorites'

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.string('streamId', 10).references('id').inTable('streams').onDelete('cascade')
    table.string('userId', 10).references('id').inTable('users').onDelete('cascade')
    table.specificType('createdAt', 'TIMESTAMPTZ(3)').defaultTo(knex.fn.now())

    // userId first, since that's the main one we're going to be filtering by
    table.primary(['userId', 'streamId'])
  })

  // for some reason can't add the serial field in the main createTable call
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.increments('cursor', { primaryKey: false })
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists(TABLE_NAME)
}
