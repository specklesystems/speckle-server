import type { Knex } from 'knex'

const tableName = 'workspaces'
const colSlug = 'slug'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.raw(`
    ALTER TABLE "${tableName}"
    ALTER COLUMN "${colSlug}" DROP DEFAULT;
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(tableName, (table) => {
    table
      .string(colSlug)
      .defaultTo(knex.raw('substring(md5(random()::text), 0, 15)'))
      .alter()
  })
}
