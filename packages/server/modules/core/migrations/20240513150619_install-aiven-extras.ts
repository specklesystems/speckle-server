import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "aiven_extras"')
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP EXTENSION "aiven_extras"')
}
