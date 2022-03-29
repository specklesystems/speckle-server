/* istanbul ignore file */
'use strict'

exports.up = async (knex) => {
  await knex.schema.createTable('file_uploads', (table) => {
    table.string('id').primary()
    table.string('streamId', 10).references('id').inTable('streams').onDelete('cascade')
    table.string('branchName')
    table.string('userId')
    table.string('fileName').notNullable()
    table.string('fileType').notNullable()
    table.integer('fileSize')
    table.boolean('uploadComplete').notNullable().defaultTo(false)
    table.timestamp('uploadDate').notNullable().defaultTo(knex.fn.now())
    // 0 = queued, 1 = in progress, 2 = success, 3 = error
    table.integer('convertedStatus').notNullable().defaultTo(0)
    table.timestamp('convertedLastUpdate').notNullable().defaultTo(knex.fn.now())
    table.string('convertedMessage')
    table.string('convertedCommitId')

    table.index(['streamId'])
  })
}

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('file_uploads')
}
