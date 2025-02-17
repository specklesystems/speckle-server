import {
  BranchCommits,
  Branches,
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
  CopyProjectModels,
  CopyProjectObjects,
  CopyProjects,
  CopyProjectVersions,
  CopyWorkspace
} from '@/modules/workspaces/domain/operations'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import { Knex } from 'knex'
import { Workspace } from '@/modules/workspacesCore/domain/types'
import { Workspaces } from '@/modules/workspacesCore/helpers/db'
import { ObjectPreview } from '@/modules/previews/domain/types'

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
  objectPreviews: (db: Knex) => db<ObjectPreview>('object_preview')
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
