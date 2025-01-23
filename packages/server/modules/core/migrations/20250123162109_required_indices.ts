import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('stream_commits', (table) => {
    // table.index('streamId') // index should already be available due to this being the first item in the composite primary key
    table.index('commitId')
  })
  await knex.schema.alterTable('branch_commits', (table) => {
    // table.index('branchId') // index should already be available due to this being the first item in the composite primary key
    table.index('commitId')
  })
  await knex.schema.alterTable('refresh_tokens', (table) => {
    // table.index('id') // index should already be available due to this being the primary key
    table.index('userId')
  })
  await knex.schema.alterTable('commits', (table) => {
    // table.index('id') // index should already be available due to this being the primary key
    table.index('author')
    table.index('sourceApplication')
    table.index('referencedObject')
    table.index('createdAt') // used in an ORDER BY clause. https://www.postgresql.org/docs/current/indexes-ordering.html
  })
  await knex.schema.alterTable('file_uploads', (table) => {
    // table.index('id') // index should already be available due to this being the primary key
    // table.index('streamId') // already explicitly indexed
    table.index('convertedStatus')
    table.index('uploadDate')
    table.index('branchName')
  })
  await knex.schema.alterTable('server_invites', (table) => {
    //table.index('id') // index should already be available due to this being the primary key
    table.index('updatedAt') // used in an ORDER BY clause. https://www.postgresql.org/docs/current/indexes-ordering.html
    table.index('target')
    table.index('createdAt')
  })
  await knex.schema.alterTable('gendo_ai_renders', (table) => {
    //table.index('id') // index should already be available due to this being the primary key
    // table.index('gendoGenerationId') // already explicitly indexed
    table.index('versionId')
    table.index('createdAt') // used in an ORDER BY clause. https://www.postgresql.org/docs/current/indexes-ordering.html
  })
  await knex.schema.alterTable('pwdreset_tokens', (table) => {
    // table.index('id') // index should already be available due to this being the primary key
    table.index('email')
    table.index('createdAt')
  })
  await knex.schema.alterTable('automation_triggers', (table) => {
    // table.index('automationRevisionId') // index should already be available due to this being the first item in the composite primary key
    table.index('triggerType')
    table.index('triggeringId')
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('stream_commits', (table) => {
    table.dropIndex('commitId')
  })
  await knex.schema.alterTable('branch_commits', (table) => {
    table.dropIndex('commitId')
  })
  await knex.schema.alterTable('refresh_tokens', (table) => {
    table.dropIndex('userId')
  })
  await knex.schema.alterTable('commits', (table) => {
    table.dropIndex('author')
    table.dropIndex('sourceApplication')
    table.dropIndex('referencedObject')
    table.dropIndex('createdAt')
  })
  await knex.schema.alterTable('file_uploads', (table) => {
    table.dropIndex('convertedStatus')
    table.dropIndex('uploadDate')
    table.dropIndex('branchName')
  })
  await knex.schema.alterTable('server_invites', (table) => {
    table.dropIndex('target')
    table.dropIndex('updatedAt')
    table.dropIndex('createdAt')
  })
  await knex.schema.alterTable('gendo_ai_renders', (table) => {
    table.dropIndex('versionId')
    table.dropIndex('createdAt')
  })
  await knex.schema.alterTable('pwdreset_tokens', (table) => {
    table.dropIndex('email')
    table.dropIndex('createdAt')
  })
  await knex.schema.alterTable('automation_triggers', (table) => {
    table.dropIndex('triggerType')
    table.dropIndex('triggeringId')
  })
}
