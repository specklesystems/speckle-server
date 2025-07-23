import type { Knex } from 'knex'

const fileUploadTableName = 'file_uploads'
const modelTableName = 'branches'

export async function up(knex: Knex): Promise<void> {
  // First set to null the modelIds fields that do not point to a model (branch)
  // otherwise, the new foreign key will fail
  await knex(fileUploadTableName)
    .whereNotIn('modelId', knex().from(modelTableName).select('id'))
    .update({ modelId: null })

  await knex.schema.alterTable(fileUploadTableName, async (table) => {
    table
      .foreign('modelId')
      .references('id')
      .inTable(modelTableName)
      .onDelete('set null')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable(fileUploadTableName, (table) => {
    table.dropForeign('modelId')
  })
}
