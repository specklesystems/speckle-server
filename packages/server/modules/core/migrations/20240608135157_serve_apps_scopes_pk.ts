import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // in the sca table, we have multiple items with the same appId and scope
  // since there are no unique ids attached to the rows
  // im using the internal ctid as a temp distinguished
  await knex.raw(`
    delete from server_apps_scopes sca1
    using server_apps_scopes sca2
    where sca1."appId" = sca2."appId"
      and sca1."scopeName" = sca2."scopeName"
      and sca2.ctid < sca1.ctid;    `)
  await knex.schema.alterTable('server_apps_scopes', (table) => {
    table.primary(['appId', 'scopeName'])
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('server_apps_scopes', (table) => {
    table.dropPrimary()
  })
}
