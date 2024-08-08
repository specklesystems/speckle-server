import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('workspaces', (table) => {
    table.boolean('discoveryEnabled').defaultTo(false)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('workspaces', (table) => {
    table.dropColumn('discoveryEnabled')
  })
}
