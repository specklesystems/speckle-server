import { Knex } from "knex";

const TABLE_NAME = 'acc_pending_sync_items'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.string('syncItemId').primary().references('id').inTable('acc_sync_items').onDelete('cascade')
    table.string('fileUploadId').notNullable().references('id').inTable('file_uploads')
    table.string('accFileUrn').notNullable()
    table.timestamp('createdAt', { precision: 3, useTz: true }).defaultTo(knex.fn.now()).notNullable()
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(TABLE_NAME)
}

