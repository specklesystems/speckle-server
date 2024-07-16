import { Knex } from 'knex'

const TABLE_NAME = 'server_invites'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    // Been unused for a while now
    table.dropColumn('used')

    // Add resources: Array<InviteResourceTarget> JSONB field
    table.jsonb('resources').defaultTo('[]').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.boolean('used').defaultTo(false).notNullable()
    table.dropColumn('resources')
  })
}
