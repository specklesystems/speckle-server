import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('sso_providers', (table) => {
    table.text('id').primary()
    table.text('providerType').notNullable()
    table.text('encryptedProviderData').notNullable()
    table.timestamp('createdAt', { precision: 3, useTz: true }).notNullable()
    table.timestamp('updatedAt', { precision: 3, useTz: true }).notNullable()
  })
  await knex.schema.createTable('user_sso_sessions', (table) => {
    table
      .string('userId')
      .references('id')
      .inTable('users')
      .notNullable()
      .onDelete('cascade')
    table
      .string('providerId')
      .references('id')
      .inTable('sso_providers')
      .notNullable()
      .onDelete('cascade')
    table.primary(['userId', 'providerId'])
    table.timestamp('createdAt', { precision: 3, useTz: true }).notNullable()
    table.bigint('lifespan').notNullable()
  })
  await knex.schema.createTable('workspace_sso_providers', (table) => {
    table
      .string('workspaceId')
      .references('id')
      .inTable('workspaces')
      .notNullable()
      .onDelete('cascade')
    table
      .string('providerId')
      .references('id')
      .inTable('sso_providers')
      .notNullable()
      .onDelete('cascade')
    table.primary(['workspaceId'])
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('user_sso_sessions')
  await knex.schema.dropTable('workspace_sso_providers')
  await knex.schema.dropTable('sso_providers')
}
