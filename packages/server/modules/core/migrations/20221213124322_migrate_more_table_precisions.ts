import { Knex } from 'knex'

/**
 * MIGRATING TIMESTAMP FIELDS TO A LOWER PRECISION, CAUSE JS CANT HANDLE
 * IT BEING THAT HIGH AND THIS GENERATES BUGS
 */

type PrecisionUpdate = {
  tableName: string
  dateColumns: string[]
}

const updates: PrecisionUpdate[] = [
  { tableName: 'commits', dateColumns: ['createdAt'] },
  { tableName: 'branches', dateColumns: ['createdAt', 'updatedAt'] },
  { tableName: 'users', dateColumns: ['createdAt'] }
]

export async function up(knex: Knex): Promise<void> {
  for (const { tableName, dateColumns } of updates) {
    await knex.schema.alterTable(tableName, (table) => {
      dateColumns.forEach((col) => {
        table
          .timestamp(col, { precision: 3, useTz: true })
          .defaultTo(knex.fn.now())
          .alter()
      })
    })
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const { tableName, dateColumns } of updates) {
    await knex.schema.alterTable(tableName, (table) => {
      dateColumns.forEach((col) => {
        table
          .timestamp(col, { precision: 6, useTz: true })
          .defaultTo(knex.fn.now())
          .alter()
      })
    })
  }
}
