/* istanbul ignore file */

const TABLE_NAME = 'blob_storage'

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.string('id', 10)
    // dont cascade on delete, cause it doesn't clean the object storage for the objs
    // it needs to be exposed as a service, to be able to cleanup fully after a stream

    table.string('streamId', 10)
    table.string('userId', 10)
    table.string('objectKey')
    table.string('fileName').notNullable()
    table.string('fileType').notNullable()
    table.integer('fileSize')
    // 0 = uploading, 1 = success, 2 = error
    table.integer('uploadStatus').notNullable().defaultTo(0)
    table.string('uploadError')
    table.specificType('createdAt', 'TIMESTAMPTZ(3)').defaultTo(knex.fn.now())
    table.primary(['id', 'streamId'])
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists(TABLE_NAME)
}
