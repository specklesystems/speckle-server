import {
  AutomationFunctionRuns,
  AutomationRevisionFunctions,
  AutomationRevisions,
  AutomationRuns,
  AutomationRunTriggers,
  Automations,
  AutomationTokens,
  AutomationTriggers,
  BranchCommits,
  Branches,
  CommentLinks,
  Comments,
  CommentViews,
  Commits,
  Objects,
  StreamCommits,
  StreamFavorites,
  Streams,
  StreamsMeta
} from '@/modules/core/dbSchema'
import { Branch } from '@/modules/core/domain/branches/types'
import { Commit } from '@/modules/core/domain/commits/types'
import { Stream } from '@/modules/core/domain/streams/types'
import {
  BranchCommitRecord,
  ObjectRecord,
  CommitRecord,
  StreamCommitRecord,
  StreamFavoriteRecord,
  StreamRecord
} from '@/modules/core/helpers/types'
import { executeBatchedSelect } from '@/modules/shared/helpers/dbHelper'
import {
  CopyProjectAutomations,
  CopyProjectComments,
  CopyProjectModels,
  CopyProjectObjects,
  CopyProjects,
  CopyProjectVersions,
  CopyProjectWebhooks,
  CopyWorkspace
} from '@/modules/workspaces/domain/operations'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import { Knex } from 'knex'
import { Workspace } from '@/modules/workspacesCore/domain/types'
import { Workspaces } from '@/modules/workspacesCore/helpers/db'
import { ObjectPreview } from '@/modules/previews/domain/types'
import {
  AutomationFunctionRunRecord,
  AutomationRecord,
  AutomationRevisionFunctionRecord,
  AutomationRevisionRecord,
  AutomationRunRecord,
  AutomationRunTriggerRecord,
  AutomationTokenRecord,
  AutomationTriggerDefinitionRecord
} from '@/modules/automate/helpers/types'
import {
  CommentLinkRecord,
  CommentRecord,
  CommentViewRecord
} from '@/modules/comments/helpers/types'
import { Webhook, WebhookEvent } from '@/modules/webhooks/domain/types'

const tables = {
  workspaces: (db: Knex) => db<Workspace>(Workspaces.name),
  projects: (db: Knex) => db<Stream>(Streams.name),
  models: (db: Knex) => db<Branch>(Branches.name),
  versions: (db: Knex) => db<Commit>(Commits.name),
  branchCommits: (db: Knex) => db<BranchCommitRecord>(BranchCommits.name),
  streamCommits: (db: Knex) => db<StreamCommitRecord>(StreamCommits.name),
  streamFavorites: (db: Knex) => db<StreamFavoriteRecord>(StreamFavorites.name),
  streamsMeta: (db: Knex) => db(StreamsMeta.name),
  objects: (db: Knex) => db<ObjectRecord>(Objects.name),
  objectPreviews: (db: Knex) => db<ObjectPreview>('object_preview'),
  automations: (db: Knex) => db<AutomationRecord>(Automations.name),
  automationTokens: (db: Knex) => db<AutomationTokenRecord>(AutomationTokens.name),
  automationRevisions: (db: Knex) =>
    db<AutomationRevisionRecord>(AutomationRevisions.name),
  automationTriggers: (db: Knex) =>
    db<AutomationTriggerDefinitionRecord>(AutomationTriggers.name),
  automationRevisionFunctions: (db: Knex) =>
    db<AutomationRevisionFunctionRecord>(AutomationRevisionFunctions.name),
  automationRuns: (db: Knex) => db<AutomationRunRecord>(AutomationRuns.name),
  automationRunTriggers: (db: Knex) =>
    db<AutomationRunTriggerRecord>(AutomationRunTriggers.name),
  automationFunctionRuns: (db: Knex) =>
    db<AutomationFunctionRunRecord>(AutomationFunctionRuns.name),
  comments: (db: Knex) => db.table<CommentRecord>(Comments.name),
  commentViews: (db: Knex) => db.table<CommentViewRecord>(CommentViews.name),
  commentLinks: (db: Knex) => db.table<CommentLinkRecord>(CommentLinks.name),
  webhooks: (db: Knex) => db.table<Webhook>('webhooks_config'),
  webhookEvents: (db: Knex) => db.table<WebhookEvent>('webhooks_events')
}

/**
 * Copies rows from the following tables:
 * - workspaces
 */
export const copyWorkspaceFactory =
  (deps: { sourceDb: Knex; targetDb: Knex }): CopyWorkspace =>
  async ({ workspaceId }) => {
    const workspace = await tables
      .workspaces(deps.sourceDb)
      .select('*')
      .where({ id: workspaceId })

    if (!workspace) {
      throw new WorkspaceNotFoundError()
    }

    await tables
      .workspaces(deps.targetDb)
      .insert(workspace)
      .onConflict(Workspaces.withoutTablePrefix.col.id)
      .ignore()

    return workspaceId
  }

/**
 * Copies rows from the following tables:
 * - streams
 * - streams_meta
 * - stream_favorites
 */
export const copyProjectsFactory =
  (deps: { sourceDb: Knex; targetDb: Knex }): CopyProjects =>
  async ({ projectIds }) => {
    const selectProjects = tables
      .projects(deps.sourceDb)
      .select('*')
      .whereIn(Streams.col.id, projectIds)
    const copiedProjectIds: string[] = []

    // Copy project record
    for await (const projects of executeBatchedSelect(selectProjects)) {
      const projectIds = projects.map((project) => project.id)
      copiedProjectIds.push(...projectIds)

      // Copy `streams` rows to target db
      await tables
        .projects(deps.targetDb)
        .insert(projects)
        .onConflict(Streams.withoutTablePrefix.col.id)
        .merge(Streams.withoutTablePrefix.cols as (keyof StreamRecord)[])

      // Fetch `stream_favorites` rows for projects in batch
      const selectStreamFavorites = tables
        .streamFavorites(deps.sourceDb)
        .select('*')
        .whereIn(StreamFavorites.col.streamId, projectIds)

      for await (const streamFavorites of executeBatchedSelect(selectStreamFavorites)) {
        // Copy `stream_favorites` rows to target db
        await tables
          .streamFavorites(deps.targetDb)
          .insert(streamFavorites)
          .onConflict()
          .ignore()
      }

      // Fetch `streams_meta` rows for projects in batch
      const selectStreamsMetadata = tables
        .streamsMeta(deps.sourceDb)
        .select('*')
        .whereIn(StreamsMeta.col.streamId, projectIds)

      for await (const streamsMetadataBatch of executeBatchedSelect(
        selectStreamsMetadata
      )) {
        // Copy `streams_meta` rows to target db
        await tables
          .streamsMeta(deps.targetDb)
          .insert(streamsMetadataBatch)
          .onConflict()
          .ignore()
      }
    }

    return copiedProjectIds
  }

/**
 * Copies rows from the following tables:
 * - branches
 */
export const copyProjectModelsFactory =
  (deps: { sourceDb: Knex; targetDb: Knex }): CopyProjectModels =>
  async ({ projectIds }) => {
    const copiedModelCountByProjectId: Record<string, number> = {}

    // Fetch `branches` rows for projects in batch
    const selectModels = tables
      .models(deps.sourceDb)
      .select('*')
      .whereIn(Branches.col.streamId, projectIds)

    for await (const models of executeBatchedSelect(selectModels)) {
      // Copy `branches` rows to target db
      await tables.models(deps.targetDb).insert(models).onConflict().ignore()

      for (const model of models) {
        copiedModelCountByProjectId[model.streamId] ??= 0
        copiedModelCountByProjectId[model.streamId]++
      }
    }

    return copiedModelCountByProjectId
  }

/**
 * Copies rows from the following tables:
 * - commits
 * - branch_commits
 * - stream_commits
 */
export const copyProjectVersionsFactory =
  (deps: { sourceDb: Knex; targetDb: Knex }): CopyProjectVersions =>
  async ({ projectIds }) => {
    const copiedVersionCountByProjectId: Record<string, number> = {}

    const selectVersions = tables
      .streamCommits(deps.sourceDb)
      .select('*')
      .join<StreamCommitRecord & Commit>(
        Commits.name,
        Commits.col.id,
        StreamCommits.col.commitId
      )
      .whereIn(StreamCommits.col.streamId, projectIds)

    for await (const versions of executeBatchedSelect(selectVersions)) {
      const { commitIds, commits } = versions.reduce(
        (all, version) => {
          const { commitId, streamId, ...commit } = version

          all.commitIds.push(commitId)
          all.streamIds.push(streamId)
          all.commits.push(commit)

          return all
        },
        { commitIds: [], streamIds: [], commits: [] } as {
          commitIds: string[]
          streamIds: string[]
          commits: CommitRecord[]
        }
      )

      // Copy `commits` rows to target db
      await tables.versions(deps.targetDb).insert(commits).onConflict().ignore()

      for (const version of versions) {
        copiedVersionCountByProjectId[version.streamId] ??= 0
        copiedVersionCountByProjectId[version.streamId]++
      }

      // Fetch `branch_commits` rows for versions in batch
      const selectBranchCommits = tables
        .branchCommits(deps.sourceDb)
        .select('*')
        .whereIn(BranchCommits.col.commitId, commitIds)

      for await (const branchCommits of executeBatchedSelect(selectBranchCommits)) {
        // Copy `branch_commits` row to target db
        await tables
          .branchCommits(deps.targetDb)
          .insert(branchCommits)
          .onConflict()
          .ignore()
      }

      // Fetch `stream_commits` rows for versions in batch
      const selectStreamCommits = tables
        .streamCommits(deps.sourceDb)
        .select('*')
        .whereIn(StreamCommits.col.commitId, commitIds)

      for await (const streamCommits of executeBatchedSelect(selectStreamCommits)) {
        // Copy `stream_commits` row to target db
        await tables
          .streamCommits(deps.targetDb)
          .insert(streamCommits)
          .onConflict()
          .ignore()
      }
    }

    return copiedVersionCountByProjectId
  }

/**
 * Copies rows from the following tables:
 * - objects
 * - object_preview
 */
export const copyProjectObjectsFactory =
  (deps: { sourceDb: Knex; targetDb: Knex }): CopyProjectObjects =>
  async ({ projectIds }) => {
    const copiedObjectCountByProjectId: Record<string, number> = {}

    // Copy `objects` table rows in batches
    const selectObjects = tables
      .objects(deps.sourceDb)
      .select<ObjectRecord[]>('*')
      .whereIn(Objects.col.streamId, projectIds)
      .orderBy(Objects.col.id)

    for await (const objects of executeBatchedSelect(selectObjects)) {
      // Write `objects` table rows to target db
      await tables.objects(deps.targetDb).insert(objects).onConflict().ignore()

      for (const object of objects) {
        copiedObjectCountByProjectId[object.streamId] ??= 0
        copiedObjectCountByProjectId[object.streamId]++
      }
    }

    // Copy `object_preview` rows in batches
    const selectObjectPreviews = tables
      .objectPreviews(deps.sourceDb)
      .select<ObjectPreview[]>('*')
      .whereIn('streamId', projectIds)

    for await (const previews of executeBatchedSelect(selectObjectPreviews)) {
      // Write `object_preview` rows to target db
      await tables.objectPreviews(deps.targetDb).insert(previews).onConflict().ignore()
    }

    return copiedObjectCountByProjectId
  }

/**
 * Copies rows from the following tables:
 * - automations
 * - automation_tokens
 * - automation_revisions
 * - automation_triggers
 * - automation_revision_functions
 * - automation_runs
 * - automation_run_triggers
 * - automation_function_runs
 */
export const copyProjectAutomationsFactory =
  (deps: { sourceDb: Knex; targetDb: Knex }): CopyProjectAutomations =>
  async ({ projectIds }) => {
    const copiedAutomationCountByProjectId: Record<string, number> = {}

    // Copy `automations` table rows in batches
    const selectAutomations = tables
      .automations(deps.sourceDb)
      .select('*')
      .whereIn(Automations.col.projectId, projectIds)

    for await (const automations of executeBatchedSelect(selectAutomations)) {
      const automationIds = automations.map((automation) => automation.id)

      // Write `automations` table rows to target db
      await tables
        .automations(deps.targetDb)
        // Cast ignores unexpected behavior in how knex handles object union types
        .insert(automations as unknown as AutomationRecord)
        .onConflict()
        .ignore()

      for (const automation of automations) {
        copiedAutomationCountByProjectId[automation.projectId] ??= 0
        copiedAutomationCountByProjectId[automation.projectId]++
      }

      // Copy `automation_tokens` rows for automation
      const selectAutomationTokens = tables
        .automationTokens(deps.sourceDb)
        .select('*')
        .whereIn(AutomationTokens.col.automationId, automationIds)

      for await (const tokens of executeBatchedSelect(selectAutomationTokens)) {
        // Write `automation_tokens` row to target db
        await tables
          .automationTokens(deps.targetDb)
          .insert(tokens)
          .onConflict()
          .ignore()
      }

      // Copy `automation_revisions` rows for automation
      const selectAutomationRevisions = tables
        .automationRevisions(deps.sourceDb)
        .select('*')
        .whereIn(AutomationRevisions.col.automationId, automationIds)

      for await (const automationRevisions of executeBatchedSelect(
        selectAutomationRevisions
      )) {
        const automationRevisionIds = automationRevisions.map((revision) => revision.id)

        // Write `automation_revisions` rows to target db
        await tables
          .automationRevisions(deps.targetDb)
          .insert(automationRevisions)
          .onConflict()
          .ignore()

        // Copy `automation_triggers` rows for automation revisions
        const automationTriggers = await tables
          .automationTriggers(deps.sourceDb)
          .select('*')
          .whereIn(AutomationTriggers.col.automationRevisionId, automationRevisionIds)

        await tables
          .automationTriggers(deps.targetDb)
          .insert(automationTriggers)
          .onConflict()
          .ignore()

        // Copy `automation_revision_functions` rows for automation revisions
        const automationRevisionFunctions = await tables
          .automationRevisionFunctions(deps.sourceDb)
          .select('*')
          .whereIn(
            AutomationRevisionFunctions.col.automationRevisionId,
            automationRevisionIds
          )

        await tables
          .automationRevisionFunctions(deps.targetDb)
          .insert(automationRevisionFunctions)
          .onConflict()
          .ignore()

        // Copy `automation_runs` rows for automation revision
        const selectAutomationRuns = tables
          .automationRuns(deps.sourceDb)
          .select('*')
          .whereIn(AutomationRuns.col.automationRevisionId, automationRevisionIds)

        for await (const automationRuns of executeBatchedSelect(selectAutomationRuns)) {
          const automationRunIds = automationRuns.map((run) => run.id)

          // Write `automation_runs` row to target db
          await tables
            .automationRuns(deps.targetDb)
            .insert(automationRuns)
            .onConflict()
            .ignore()

          // Copy `automation_run_triggers` rows for automation run
          const automationRunTriggers = await tables
            .automationRunTriggers(deps.sourceDb)
            .select('*')
            .whereIn(AutomationRunTriggers.col.automationRunId, automationRunIds)

          await tables
            .automationRunTriggers(deps.targetDb)
            .insert(automationRunTriggers)
            .onConflict()
            .ignore()

          // Copy `automation_function_runs` rows for automation run
          const automationFunctionRuns = await tables
            .automationFunctionRuns(deps.sourceDb)
            .select('*')
            .whereIn(AutomationFunctionRuns.col.runId, automationRunIds)

          await tables
            .automationFunctionRuns(deps.targetDb)
            .insert(automationFunctionRuns)
            .onConflict()
            .ignore()
        }
      }
    }

    return copiedAutomationCountByProjectId
  }

/**
 * Copies rows from the following tables:
 * - comments
 * - comment_views
 * - comment_links
 */
export const copyProjectCommentsFactory =
  (deps: { sourceDb: Knex; targetDb: Knex }): CopyProjectComments =>
  async ({ projectIds }) => {
    const copiedCommentCountByProjectId: Record<string, number> = {}

    // Copy `comments` table rows in batches
    const selectComments = tables
      .comments(deps.sourceDb)
      .select('*')
      .whereIn(Comments.col.streamId, projectIds)

    for await (const comments of executeBatchedSelect(selectComments)) {
      const commentIds = comments.map((comment) => comment.id)

      // Write `comments` rows to target db
      await tables.comments(deps.targetDb).insert(comments).onConflict().ignore()

      for (const comment of comments) {
        copiedCommentCountByProjectId[comment.streamId] ??= 0
        copiedCommentCountByProjectId[comment.streamId]++
      }

      // Copy `comment_views` table rows
      const commentViews = await tables
        .commentViews(deps.sourceDb)
        .select('*')
        .whereIn(CommentViews.col.commentId, commentIds)

      await tables
        .commentViews(deps.targetDb)
        .insert(commentViews)
        .onConflict()
        .ignore()

      // Copy `comment_links` table rows
      const commentLinks = await tables
        .commentLinks(deps.sourceDb)
        .select('*')
        .whereIn(CommentLinks.col.commentId, commentIds)

      await tables
        .commentLinks(deps.targetDb)
        .insert(commentLinks)
        .onConflict()
        .ignore()
    }

    return copiedCommentCountByProjectId
  }

/**
 * Copies rows from the following tables:
 * - webhooks_config
 * - webhooks_events
 */
export const copyProjectWebhooksFactory =
  (deps: { sourceDb: Knex; targetDb: Knex }): CopyProjectWebhooks =>
  async ({ projectIds }) => {
    const copiedWebhookCountByProjectId: Record<string, number> = {}

    // Copy `webhooks_config` table rows in batches
    const selectWebhooks = tables
      .webhooks(deps.sourceDb)
      .select('*')
      .whereIn('streamId', projectIds)

    for await (const webhooks of executeBatchedSelect(selectWebhooks)) {
      const webhookIds = webhooks.map((webhook) => webhook.id)

      // Write `webhooks_config` rows to target db
      await tables.webhooks(deps.targetDb).insert(webhooks).onConflict().ignore()

      for (const webhook of webhooks) {
        copiedWebhookCountByProjectId[webhook.streamId] ??= 0
        copiedWebhookCountByProjectId[webhook.streamId]++
      }

      // Copy `webhooks_events` table rows in batches
      const selectWebhookEvents = tables
        .webhookEvents(deps.sourceDb)
        .select('*')
        .whereIn('webhookId', webhookIds)

      for await (const webhookEvents of executeBatchedSelect(selectWebhookEvents)) {
        // Write `webhooks_events` rows to target db
        await tables
          .webhookEvents(deps.targetDb)
          .insert(webhookEvents)
          .onConflict()
          .ignore()
      }
    }

    return copiedWebhookCountByProjectId
  }
