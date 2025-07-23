import type { Knex } from 'knex'

const TABLE_NAME = 'file_uploads'

/**
 * Rows like this shouldn't even exist, but in case they do - we'll fix their values to be non nullable
 */
async function fixExistingNullRows(knex: Knex) {
  await knex.table(TABLE_NAME).whereNull('branchName').update({
    branchName: 'main'
  })

  // table doesn't even have an FK to users...
  await knex.table(TABLE_NAME).whereNull('userId').update({
    userId: '0'
  })
}

export async function up(knex: Knex): Promise<void> {
  await fixExistingNullRows(knex)

  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.string('branchName').notNullable().alter()
    table.string('userId').notNullable().alter()

    // lets migrate the precision as well
    table
      .timestamp('uploadDate', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .alter()
    table
      .timestamp('convertedLastUpdate', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .alter()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.string('branchName').nullable().alter()
    table.string('userId').nullable().alter()

    table
      .timestamp('uploadDate', { precision: 6, useTz: true })
      .defaultTo(knex.fn.now())
      .alter()
    table
      .timestamp('convertedLastUpdate', { precision: 6, useTz: true })
      .defaultTo(knex.fn.now())
      .alter()
  })
}
