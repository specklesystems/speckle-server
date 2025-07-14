import { Knex } from 'knex'

const TABLE_NAME = 'acc_sync_items'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.string('id', 10).primary()
    table.string('projectId').notNullable().references('id').inTable('streams')
    table.string('modelId').notNullable()
    table.string('accRegion').notNullable()
    table.string('accHubId').notNullable()
    table.string('accProjectId').notNullable()
    table.string('accRootProjectFolderId').notNullable()
    table.string('accFileName').notNullable()
    table.string('accFileExtension').notNullable()
    table.string('accFileLineageId').notNullable().unique()
    table.string('accWebhookId').nullable()
    table
      .enu('status', ['SYNC', 'INITIALIZING', 'SYNCING', 'FAILED', 'PAUSED'])
      .notNullable()
      .defaultTo('SYNC')
    table.string('authorId', 10).references('id').inTable('users')
    table
      .timestamp('createdAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
    table
      .timestamp('updatedAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(TABLE_NAME)
}
