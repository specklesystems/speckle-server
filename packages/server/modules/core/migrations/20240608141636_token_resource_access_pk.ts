import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('token_resource_access', (table) => {
    table.primary(['tokenId', 'resourceId', 'resourceType'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('token_resource_access', (table) => {
    table.dropPrimary()
  })
}
