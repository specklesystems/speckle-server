import { Knex } from 'knex'

const GENDO_TABLE_NAME = 'gendo_ai_renders'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable(GENDO_TABLE_NAME, (table) => {
    table.text('id').primary()
    table.text('userId').references('id').inTable('users').onDelete('cascade')
    table.text('projectId').references('id').inTable('streams').onDelete('cascade')
    table.text('modelId').references('id').inTable('branches').onDelete('cascade')
    table.text('versionId').references('id').inTable('commits').onDelete('cascade')

    table
      .timestamp('createdAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()
    table
      .timestamp('updatedAt', { precision: 3, useTz: true })
      .defaultTo(knex.fn.now())
      .notNullable()

    table.text('gendoGenerationId') // Nullable as the api can fail on first call
    table.text('status').notNullable()
    table.text('prompt').notNullable()
    table.jsonb('camera').notNullable()
    table.text('baseImage').notNullable() // NOTE: these are references to blobIds
    table.text('responseImage') // NOTE: these are references to blobIds

    table.index(['gendoGenerationId'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable(GENDO_TABLE_NAME)
}
