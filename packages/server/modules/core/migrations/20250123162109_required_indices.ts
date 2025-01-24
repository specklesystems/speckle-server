import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  //stream_commits
  await knex.raw(
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS stream_commits_commitid_index ON public.stream_commits USING btree ("commitId")'
  )

  //branch_commits
  await knex.raw(
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS branch_commits_commitid_index ON public.branch_commits USING btree ("commitId")'
  )

  //refresh_tokens
  await knex.raw(
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS refresh_tokens_userid_index ON public.refresh_tokens USING btree ("userId")'
  )

  //commits
  await knex.raw(
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS commits_author_index ON public.commits USING btree ("author")'
  )
  await knex.raw(
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS commits_sourceapplication_index ON public.commits USING btree ("sourceApplication")'
  )
  await knex.raw(
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS commits_referencedobject_index ON public.commits USING btree ("referencedObject")'
  )
  await knex.raw(
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS commits_createdat_index ON public.commits USING btree ("createdAt")'
  )

  //file_uploads
  await knex.raw(
    'DROP INDEX CONCURRENTLY IF EXISTS file_uploads_streamid_index' // Drop the old index on streamid alone
  )
  await knex.raw(
    // create new composite index
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS file_uploads_streamid_convertedstatus_index ON public.file_uploads USING btree ("streamId", "convertedStatus")'
  )
  await knex.raw(
    // create new composite index
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS file_uploads_streamid_uploaddate_index ON public.file_uploads USING btree ("streamId", "uploadDate")'
  )
  await knex.raw(
    // create new composite index
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS file_uploads_streamid_branchname_index ON public.file_uploads USING btree ("streamId", "branchName")'
  )

  //server_invites
  await knex.raw(
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS server_invites_updatedat_index ON public.server_invites USING btree ("updatedAt")'
  )
  await knex.raw(
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS server_invites_target_createdat_index ON public.server_invites USING btree ("target", "createdAt")'
  )

  //gendo_ai_renders
  await knex.raw(
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS gendo_ai_renders_id_versionid_createdat_index ON public.gendo_ai_renders USING btree ("id", "versionId", "createdAt")'
  )

  //pwdreset_tokens
  await knex.raw(
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS pwdreset_tokens_email_createdat_index ON public.pwdreset_tokens USING btree ("email", "createdAt")'
  )

  //automation_triggers
  await knex.raw(
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS automation_triggers_triggeringid_triggertype_index ON public.automation_triggers USING btree ("triggeringId", "triggerType")'
  )
  await knex.raw(
    'CREATE INDEX CONCURRENTLY IF NOT EXISTS automation_triggers_automationrevisionid_triggeringid_index ON public.automation_triggers USING btree ("automationRevisionId", "triggeringId")'
  )
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX CONCURRENTLY stream_commits_commitid_index')
  await knex.raw('DROP INDEX CONCURRENTLY branch_commits_commitid_index')
  await knex.raw('DROP INDEX CONCURRENTLY refresh_tokens_userid_index')
  await knex.raw('DROP INDEX CONCURRENTLY commits_author_index')
  await knex.raw('DROP INDEX CONCURRENTLY commits_sourceapplication_index')
  await knex.raw('DROP INDEX CONCURRENTLY commits_referencedobject_index')
  await knex.raw('DROP INDEX CONCURRENTLY commits_createdat_index')
  await knex.raw('DROP INDEX CONCURRENTLY file_uploads_streamid_convertedstatus_index')
  await knex.raw('DROP INDEX CONCURRENTLY file_uploads_streamid_uploaddate_index')
  await knex.raw('DROP INDEX CONCURRENTLY file_uploads_streamid_branchname_index')
  await knex.raw('DROP INDEX CONCURRENTLY server_invites_updatedat_index')
  await knex.raw('DROP INDEX CONCURRENTLY server_invites_target_createdat_index')
  await knex.raw(
    'DROP INDEX CONCURRENTLY gendo_ai_renders_id_versionid_createdat_index'
  )
  await knex.raw('DROP INDEX CONCURRENTLY pwdreset_tokens_email_createdat_index')
  await knex.raw(
    'DROP INDEX CONCURRENTLY automation_triggers_triggeringid_triggertype_index'
  )
  await knex.raw(
    'DROP INDEX CONCURRENTLY automation_triggers_automationrevisionid_triggeringid_index'
  )
}

// This migration is not transactional because it uses CREATE INDEX CONCURRENTLY
export const config = { transaction: false }
