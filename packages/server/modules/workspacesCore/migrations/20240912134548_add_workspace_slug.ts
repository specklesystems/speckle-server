import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('workspaces', (table) => {
    table
      .text('slug')
      .notNullable()
      .defaultTo(knex.raw('substring(md5(random()::text), 0, 15)')) // lets generate a random thing here to make it not nullable
      .unique() // this also adds an index to the col
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('workspaces', (table) => {
    table.dropColumn('slug')
  })
}
