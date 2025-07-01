import { Knex } from 'knex'

const tableName = 'object_preview'
const attemptsCol = 'attempts'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.integer(attemptsCol).defaultTo(0).notNullable()

    table.dropIndex(['previewStatus', 'priority', 'lastUpdate'])
    table.index(['previewStatus', 'priority', 'lastUpdate', attemptsCol])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.dropColumn(attemptsCol)
    table.dropIndex(['previewStatus', 'priority', 'lastUpdate', attemptsCol])
    table.index(['previewStatus', 'priority', 'lastUpdate'])
  })
}
