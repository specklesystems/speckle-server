import { Knex } from 'knex'
import { Environment } from '@speckle/shared'

// TODO: Ask whether migrations should be behind a feature flag or not??? probably... not? as we can get db in inconsistent state
const { FF_GENDOAI_MODULE_ENABLED } = Environment.getFeatureFlags()
const GENDO_TABLE_NAME = 'gendo_ai_renders'

export async function up(knex: Knex): Promise<void> {
  if (!FF_GENDOAI_MODULE_ENABLED) return
  // TODO
  await knex.schema.createTable(GENDO_TABLE_NAME, (table) => {
    table.text('id').primary()
    table.text('userId').references('id').inTable('users').onDelete('cascade')
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
    table.jsonb('cameraLocation').notNullable()
    table.text('baseImage').notNullable() // TODO: hopefull these will be blob urls and not the raw deal
    table.text('responseImage').notNullable() // TODO: hopefull these will be blob urls and not the raw deal

    table.index(['gendoGenerationId'])
  })
}

export async function down(knex: Knex): Promise<void> {
  if (!FF_GENDOAI_MODULE_ENABLED) return
  await knex.schema.dropTable(GENDO_TABLE_NAME)
}
