import {
  BranchCommits,
  Branches,
  buildTableHelper,
  Commits,
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
  StreamCommitRecord,
  StreamFavoriteRecord
} from '@/modules/core/helpers/types'
import { RegionRecord } from '@/modules/multiregion/helpers/types'
import { Regions } from '@/modules/multiregion/repositories'
import { executeBatchedSelect } from '@/modules/shared/helpers/dbHelper'
import {
  CopyProjectModels,
  CopyProjects,
  CopyProjectVersions,
  GetDefaultRegion,
  UpsertRegionAssignment
} from '@/modules/workspaces/domain/operations'
import { WorkspaceRegionAssignment } from '@/modules/workspacesCore/domain/types'
import { Knex } from 'knex'

export const WorkspaceRegions = buildTableHelper('workspace_regions', [
  'workspaceId',
  'regionKey'
])

const tables = {
  workspaceRegions: (db: Knex) => db<WorkspaceRegionAssignment>(WorkspaceRegions.name),
  regions: (db: Knex) => db<RegionRecord>(Regions.name),
  projects: (db: Knex) => db<Stream>(Streams.name),
  models: (db: Knex) => db<Branch>(Branches.name),
  versions: (db: Knex) => db<Commit>(Commits.name),
  branchCommits: (db: Knex) => db<BranchCommitRecord>(BranchCommits.name),
  streamCommits: (db: Knex) => db<StreamCommitRecord>(StreamCommits.name),
  streamFavorites: (db: Knex) => db<StreamFavoriteRecord>(StreamFavorites.name),
  streamsMeta: (db: Knex) => db(StreamsMeta.name)
}

export const upsertRegionAssignmentFactory =
  (deps: { db: Knex }): UpsertRegionAssignment =>
  async (params) => {
    const { workspaceId, regionKey } = params
    const [row] = await tables
      .workspaceRegions(deps.db)
      .insert({ workspaceId, regionKey }, '*')
      .onConflict(['workspaceId', 'regionKey'])
      .merge()

    return row
  }

export const getDefaultRegionFactory =
  (deps: { db: Knex }): GetDefaultRegion =>
  async (params) => {
    const { workspaceId } = params
    const row = await tables
      .regions(deps.db)
      .select<RegionRecord>(Regions.cols)
      .join(WorkspaceRegions.name, WorkspaceRegions.col.regionKey, Regions.col.key)
      .where({ [WorkspaceRegions.col.workspaceId]: workspaceId })
      .first()

    return row
  }

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
      for (const project of projects) {
        // Store copied project id
        copiedProjectIds.push(project.id)

        // Copy `streams` row to target db
        await tables.projects(deps.targetDb).insert(project).onConflict().ignore()
      }

      const projectIds = projects.map((project) => project.id)

      // Fetch `stream_favorites` rows for projects in batch
      const selectStreamFavorites = tables
        .streamFavorites(deps.sourceDb)
        .select('*')
        .whereIn(StreamFavorites.col.streamId, projectIds)

      for await (const streamFavorites of executeBatchedSelect(selectStreamFavorites)) {
        for (const streamFavorite of streamFavorites) {
          // Copy `stream_favorites` row to target db
          await tables
            .streamFavorites(deps.targetDb)
            .insert(streamFavorite)
            .onConflict()
            .ignore()
        }
      }

      // Fetch `streams_meta` rows for projects in batch
      const selectStreamsMetadata = tables
        .streamsMeta(deps.sourceDb)
        .select('*')
        .whereIn(StreamsMeta.col.streamId, projectIds)

      for await (const streamsMetadataBatch of executeBatchedSelect(
        selectStreamsMetadata
      )) {
        for (const streamMetadata of streamsMetadataBatch) {
          // Copy `streams_meta` row to target db
          await tables
            .streamsMeta(deps.targetDb)
            .insert(streamMetadata)
            .onConflict()
            .ignore()
        }
      }
    }

    return copiedProjectIds
  }

export const copyProjectModelsFactory =
  (deps: { sourceDb: Knex; targetDb: Knex }): CopyProjectModels =>
  async ({ projectIds }) => {
    const copiedModelIds: Record<string, string[]> = projectIds.reduce(
      (result, id) => ({ ...result, [id]: [] }),
      {}
    )

    for (const projectId of projectIds) {
      const selectModels = tables
        .models(deps.sourceDb)
        .select('*')
        .where({ streamId: projectId })

      for await (const models of executeBatchedSelect(selectModels)) {
        for (const model of models) {
          // Store copied model ids
          copiedModelIds[projectId].push(model.id)

          // Copy `branches` row to target db
          await tables.models(deps.targetDb).insert(model).onConflict().ignore()
        }
      }
    }

    return copiedModelIds
  }

export const copyProjectVersionsFactory =
  (deps: { sourceDb: Knex; targetDb: Knex }): CopyProjectVersions =>
  async ({ projectIds }) => {
    const copiedVersionIds: Record<string, string[]> = projectIds.reduce(
      (result, id) => ({ ...result, [id]: [] }),
      {}
    )

    for (const projectId of projectIds) {
      const selectVersions = tables
        .streamCommits(deps.sourceDb)
        .select('*')
        .join<StreamCommitRecord & Commit>(
          Commits.name,
          Commits.col.id,
          StreamCommits.col.commitId
        )
        .where({ streamId: projectId })

      for await (const versions of executeBatchedSelect(selectVersions)) {
        for (const version of versions) {
          const { commitId, ...commit } = version

          // Store copied version id
          copiedVersionIds[projectId].push(commitId)

          // Copy `commits` row to target db
          await tables.versions(deps.targetDb).insert(commit).onConflict().ignore()
        }

        const commitIds = versions.map((version) => version.commitId)

        // Fetch `branch_commits` rows for versions in batch
        const selectBranchCommits = tables
          .branchCommits(deps.sourceDb)
          .select('*')
          .whereIn(BranchCommits.col.commitId, commitIds)

        for await (const branchCommits of executeBatchedSelect(selectBranchCommits)) {
          for (const branchCommit of branchCommits) {
            // Copy `branch_commits` row to target db
            await tables
              .branchCommits(deps.targetDb)
              .insert(branchCommit)
              .onConflict()
              .ignore()
          }
        }

        // Fetch `stream_commits` rows for versions in batch
        const selectStreamCommits = tables
          .streamCommits(deps.sourceDb)
          .select('*')
          .whereIn(StreamCommits.col.commitId, commitIds)

        for await (const streamCommits of executeBatchedSelect(selectStreamCommits)) {
          for (const streamCommit of streamCommits) {
            // Copy `stream_commits` row to target db
            await tables
              .streamCommits(deps.targetDb)
              .insert(streamCommit)
              .onConflict()
              .ignore()
          }
        }
      }
    }

    return copiedVersionIds
  }
