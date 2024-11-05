import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "aiven_extras"')
}

// no down provided
export async function down(): Promise<void> {}
