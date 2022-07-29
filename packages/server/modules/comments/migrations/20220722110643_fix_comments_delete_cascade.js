const { Users } = require('@/modules/core/dbSchema')

const COMMENTS_TABLE = 'comments'
const COMMENT_VIEWS_TABLE = 'comment_views'

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Delete all orphaned comments, which can be there even though there was a FK there before for some reason
  await knex
    .table(COMMENTS_TABLE)
    .whereNotNull(`${COMMENTS_TABLE}.parentComment`)
    .whereNotIn(
      `${COMMENTS_TABLE}.parentComment`,
      knex.table(`${COMMENTS_TABLE} as c2`).select('c2.id')
    )
    .delete()

  // Fix comments FKs
  await knex.schema.alterTable(COMMENTS_TABLE, (table) => {
    table.dropForeign('authorId')
    table.foreign('authorId').references(Users.col.id).onDelete('CASCADE')

    table.dropForeign('parentComment')
    table
      .foreign('parentComment')
      .references(`${COMMENTS_TABLE}.id`)
      .onDelete('CASCADE')
  })

  // Fix comment_views FKs
  await knex.schema.alterTable(COMMENT_VIEWS_TABLE, (table) => {
    table.dropForeign('userId')
    table.foreign('userId').references(Users.col.id).onDelete('CASCADE')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.alterTable(COMMENTS_TABLE, (table) => {
    table.dropForeign('authorId')
    table.foreign('authorId').references(Users.col.id).onDelete('NO ACTION')

    table.dropForeign('parentComment')
    table
      .foreign('parentComment')
      .references(`${COMMENTS_TABLE}.id`)
      .onDelete('NO ACTION')
  })

  await knex.schema.alterTable(COMMENT_VIEWS_TABLE, (table) => {
    table.dropForeign('userId')
    table.foreign('userId').references(Users.col.id).onDelete('NO ACTION')
  })
}
