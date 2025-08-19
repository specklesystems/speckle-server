import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('stream_commits', (table) => {
    table.index('commitId')
  })

  await knex.schema.alterTable('branch_commits', (table) => {
    table.index('commitId')
  })

  await knex.schema.alterTable('refresh_tokens', (table) => {
    table.index('userId')
  })

  await knex.schema.alterTable('commits', (table) => {
    table.index('author')
    table.index('sourceApplication')
    table.index('referencedObject')
    table.index('createdAt')
  })

  await knex.schema.alterTable('file_uploads', (table) => {
    table.dropIndex('streamId') // Drop the old index on streamid alone as it's always used in conjunction with other columns
    table.index(['streamId', 'convertedStatus'])
    table.index(['streamId', 'uploadDate'])
    table.index(['streamId', 'branchName'])
  })

  await knex.schema.alterTable('server_invites', (table) => {
    table.index('updatedAt')
    table.index(['target', 'createdAt'])
  })

  await knex.schema.alterTable('gendo_ai_renders', (table) => {
    table.index(['id', 'versionId', 'createdAt'])
  })

  await knex.schema.alterTable('pwdreset_tokens', (table) => {
    table.index(['email', 'createdAt'])
  })

  await knex.schema.alterTable('automation_triggers', (table) => {
    table.index(['triggeringId', 'triggerType'])
    table.index(['automationRevisionId', 'triggeringId'])
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
    table.index('streamId')
    table.dropIndex(['streamId', 'convertedStatus'])
    table.dropIndex(['streamId', 'uploadDate'])
    table.dropIndex(['streamId', 'branchName'])
  })
  await knex.schema.alterTable('server_invites', (table) => {
    table.dropIndex('updatedAt')
    table.dropIndex(['target', 'createdAt'])
  })
  await knex.schema.alterTable('gendo_ai_renders', (table) => {
    table.dropIndex(['id', 'versionId', 'createdAt'])
  })
  await knex.schema.alterTable('pwdreset_tokens', (table) => {
    table.dropIndex(['email', 'createdAt'])
  })
  await knex.schema.alterTable('automation_triggers', (table) => {
    table.dropIndex(['triggeringId', 'triggerType'])
    table.dropIndex(['automationRevisionId', 'triggeringId'])
  })
}
