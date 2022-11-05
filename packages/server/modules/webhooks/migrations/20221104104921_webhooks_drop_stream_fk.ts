import { Knex } from 'knex'

const TABLE_NAME = 'webhooks_config'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    // dropping the foreign key and not adding a new one
    // if we still had the constraint, the late triggered event ie stream_delete hooks
    // would not find the webhook configs
    table.dropForeign('streamId')
  })
}

export async function down() {
  return
}
