import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.raw('update workspaces set slug = id')
}

export async function down(): Promise<void> {}
