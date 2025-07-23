import type { Knex } from 'knex'

const tableName = 'object_preview'
const attemptsCol = 'attempts'

/**
 * In getPaginatedObjectsPreviewsBaseQueryFactory we filter by previewStatus and attempts.
 * We then sort by lastUpdate and objectId.
 */
const indexCols = ['previewStatus', attemptsCol, 'lastUpdate', 'objectId']

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.integer(attemptsCol).defaultTo(0).notNullable()
    table.index(indexCols)
  })
}

export async function down(knex: Knex): Promise<void> {
  // drop in a two step process to first remove the index then the column
  await knex.schema.alterTable(tableName, (table) => {
    table.dropIndex(indexCols)
  })

  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn(attemptsCol)
  })
}
