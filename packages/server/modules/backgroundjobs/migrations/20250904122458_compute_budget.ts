import { TIME, TIME_MS } from '@speckle/shared'
import { type Knex } from 'knex'

const JOB_TABLE_NAME = 'background_jobs'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(JOB_TABLE_NAME, (table) => {
    table.integer('remainingComputeBudgetSeconds').defaultTo(TIME.hour).notNullable()
    table.dropColumn('timeoutMs')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(JOB_TABLE_NAME, (table) => {
    table.dropColumn('remainingComputeBudgetSeconds')
    table.integer('timeoutMs').defaultTo(TIME_MS.day).notNullable()
  })
}
