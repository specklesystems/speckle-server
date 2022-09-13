import { Knex } from 'knex'

const TABLE_NAME = 'functions'

export async function up(knex: Knex): Promise<void> {
  // await knex.schema.createTable
  await knex.schema.createTable(TABLE_NAME, (table) => {
    table.string('id', 10).primary()
    table.string('streamId', 10).references('id').inTable('streams').onDelete('cascade')
    table.string('url')
  })
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists(TABLE_NAME)
}
