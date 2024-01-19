import { Knex } from 'knex'

const name = 'automate:report-results'
const description = 'Allows the app to report automation results to the server.'

export async function up(knex: Knex): Promise<void> {
  await knex('scopes').insert({ name, description, public: false })
}

export async function down(knex: Knex): Promise<void> {
  await knex('scopes').where({ name }).delete()
}
