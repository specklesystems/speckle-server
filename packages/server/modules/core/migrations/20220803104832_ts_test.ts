import { Knex } from 'knex'

/**
 * This is a fake migration, only used to test TS support
 */

export async function up(knex: Knex): Promise<void> {
  // do nothing
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  knex.VERSION
}

export async function down(knex: Knex): Promise<void> {
  // do nothing
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  knex.VERSION
}
