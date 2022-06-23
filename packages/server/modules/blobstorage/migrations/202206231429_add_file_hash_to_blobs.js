/* istanbul ignore file */

const TABLE_NAME = 'blob_storage'
const HASH_COLUMN_NAME = 'fileHash'

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.schema.table(TABLE_NAME, (table) => {
    table.string(HASH_COLUMN_NAME)
  })
}

exports.down = async (knex) => {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn(HASH_COLUMN_NAME)
  })
}
