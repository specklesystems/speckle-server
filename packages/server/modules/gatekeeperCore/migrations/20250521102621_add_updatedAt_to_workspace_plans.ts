import type { Knex } from 'knex'

const TABLE_NAME = 'workspace_plans'
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table
      .timestamp('updatedAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
  })

  // we do not have traceability when the plan was changed; assuming it never did as a starting point
  await knex(TABLE_NAME).update({ updatedAt: knex.ref('createdAt') })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(TABLE_NAME, (table) => {
    table.dropColumn('updatedAt')
  })
}
