import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex('workspace_plans').where('name', '=', 'team').update({ name: 'starter' })
  await knex('workspace_plans').where('name', '=', 'pro').update({ name: 'plus' })
}

export async function down(knex: Knex): Promise<void> {
  await knex('workspace_plans').where('name', '=', 'starter').update({ name: 'team' })
  await knex('workspace_plans').where('name', '=', 'plus').update({ name: 'pro' })
}
