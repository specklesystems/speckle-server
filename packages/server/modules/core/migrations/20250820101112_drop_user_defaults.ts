import type { Knex } from 'knex'

const tableName = 'users'
const colUuid = 'suuid'
const colCreatedAt = 'createdAt'
const colVerified = 'verified'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    ALTER TABLE "${tableName}"
    ALTER COLUMN "${colUuid}" DROP DEFAULT,
    ALTER COLUMN "${colCreatedAt}" DROP DEFAULT,
    ALTER COLUMN "${colVerified}" DROP DEFAULT;
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.string(colUuid).defaultTo(knex.raw('gen_random_uuid()')).alter()
    table.timestamp(colCreatedAt).defaultTo(knex.fn.now()).alter()
    table.boolean(colVerified).defaultTo(false).alter()
  })
}
