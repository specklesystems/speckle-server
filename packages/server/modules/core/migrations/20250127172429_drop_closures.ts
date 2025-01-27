import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.dropTable('object_children_closure')
}

export async function down(): Promise<void> {
  // do nothing, we do not care
}
