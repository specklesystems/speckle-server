import type { Knex } from 'knex'

const tableName = 'streams'
const colName = 'name'
const colCreatedAt = 'createdAt'
const colUpdatedAt = 'updatedAt'
const colAllowPublicComments = 'allowPublicComments'
const colVisibility = 'visibility'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    ALTER TABLE "${tableName}"
    ALTER COLUMN "${colName}" DROP DEFAULT,
    ALTER COLUMN "${colCreatedAt}" DROP DEFAULT,
    ALTER COLUMN "${colUpdatedAt}" DROP DEFAULT,
    ALTER COLUMN "${colAllowPublicComments}" DROP DEFAULT,
    ALTER COLUMN "${colVisibility}" DROP DEFAULT;
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table.string(colName).defaultTo('Unnamed Stream').alter()
    table.timestamp(colUpdatedAt).defaultTo(knex.fn.now()).alter()
    table.timestamp(colCreatedAt).defaultTo(knex.fn.now()).alter()
    table.boolean(colAllowPublicComments).defaultTo(false).alter()
    table.string(colVisibility).defaultTo('private').alter()
  })
}
