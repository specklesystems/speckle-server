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
    table.timestamp('createdAt')

    // userId first, since that's the main one we're going to be filtering by
    table.primary(['userId', 'streamId'])
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists(TABLE_NAME)
}
