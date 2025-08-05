import type { Knex } from 'knex'

const TABLE_NAME = 'acc_sync_items'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.string('id', 10).primary()
    table
      .string('projectId')
      .notNullable()
      .references('id')
      .inTable('streams')
      .onDelete('cascade')
    table.string('modelId').notNullable()
    table
      .string('automationId')
      .notNullable()
      .references('id')
      .inTable('automations')
      .onDelete('cascade')
    table.string('accRegion').notNullable()
    table.string('accHubId').notNullable()
    table.string('accProjectId').notNullable()
    table.string('accRootProjectFolderUrn').notNullable()
    table.string('accFileName').notNullable()
    table.string('accFileExtension').notNullable()
    table.string('accFileLineageUrn').notNullable()
    table.integer('accFileVersionIndex').defaultTo(0)
    table.string('accFileVersionUrn').notNullable()
    table.string('accFileViewName').nullable()
    table.string('accWebhookId').nullable()
    table
      .enum('status', ['pending', 'syncing', 'failed', 'paused', 'succeeded'])
      .notNullable()
      .defaultTo('pending')
    table.string('authorId', 10).references('id').inTable('users').onDelete('set null')
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
