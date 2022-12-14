import { BranchCommits, Branches, Commits, knex } from '@/modules/core/dbSchema'
import { ProjectModelsArgs } from '@/modules/core/graph/generated/graphql'
import { BranchRecord, CommitRecord } from '@/modules/core/helpers/types'
import {
  BatchedSelectOptions,
  executeBatchedSelect
} from '@/modules/shared/helpers/dbHelper'
import crs from 'crypto-random-string'
import { Knex } from 'knex'
import { clamp } from 'lodash'

export const generateBranchId = () => crs({ length: 10 })

export async function getStreamBranchByName(streamId: string, name: string) {
  if (!streamId || !name) return null

  const q = Branches.knex<BranchRecord>()
    .where(Branches.col.streamId, streamId)
    .andWhere(knex.raw('LOWER(name) = ?', [name.toLowerCase()]))

  return await q.first()
}

export function getBatchedStreamBranches(
  streamId: string,
  options?: Partial<BatchedSelectOptions>
) {
  const baseQuery = Branches.knex<BranchRecord[]>()
    .where(Branches.col.streamId, streamId)
    .orderBy(Branches.col.id)

  return executeBatchedSelect(baseQuery, options)
}

export async function insertBranches(
  branches: BranchRecord[],
  options?: Partial<{ trx: Knex.Transaction }>
) {
  const q = Branches.knex().insert(branches)
  if (options?.trx) q.transacting(options.trx)
  return await q
}

export async function getStreamBranchCounts(streamIds: string[]) {
  if (!streamIds?.length) return []

  const q = Branches.knex()
    .select(Branches.col.streamId)
    .whereIn(Branches.col.streamId, streamIds)
    .count()
    .groupBy(Branches.col.streamId)

  const results = (await q) as { streamId: string; count: string }[]
  return results.map((r) => ({ ...r, count: parseInt(r.count) }))
}

export async function getStreamBranchCount(streamId: string) {
  const [res] = await getStreamBranchCounts([streamId])
  return res?.count || 0
}

export async function getBranchCommitCounts(branchIds: string[]) {
  if (!branchIds?.length) return []

  const q = Branches.knex()
    .select(Branches.col.id)
    .whereIn(Branches.col.id, branchIds)
    .innerJoin(BranchCommits.name, BranchCommits.col.branchId, Branches.col.id)
    .innerJoin(Commits.name, Commits.col.id, BranchCommits.col.commitId)
    .count()
    .groupBy(Branches.col.id)

  const results = (await q) as { id: string; count: string }[]
  return results.map((r) => ({ ...r, count: parseInt(r.count) }))
}

export async function getBranchCommitCount(branchId: string) {
  const [res] = await getBranchCommitCounts([branchId])
  return res?.count || 0
}

export async function getBranchLatestCommits(branchIds: string[]) {
  if (!branchIds?.length) return []

  const q = Branches.knex()
    .select<Array<CommitRecord & { branchId: string }>>([
      ...Commits.cols,
      knex.raw(`?? as branchId`, [Branches.col.id])
    ])
    .distinctOn(Branches.col.id)
    .whereIn(Branches.col.id, branchIds)
    .innerJoin(BranchCommits.name, BranchCommits.col.branchId, Branches.col.id)
    .innerJoin(Commits.name, Commits.col.id, BranchCommits.col.commitId)
    .orderBy([
      { column: Branches.col.id },
      { column: Commits.col.createdAt, order: 'desc' }
    ])

  return await q
}

function getPaginatedProjectModelsBaseQuery<T>(
  projectId: string,
  params: ProjectModelsArgs
) {
  const { filter } = params

  const q = Branches.knex()
    .select<T>(Branches.cols)
    .where(Branches.col.streamId, projectId)
    .groupBy(Branches.col.id)

  if (filter?.contributors?.length || filter?.sourceApps?.length) {
    q.innerJoin(BranchCommits.name, BranchCommits.col.branchId, Branches.col.id)
    q.innerJoin(Commits.name, Commits.col.id, BranchCommits.col.commitId)

    if (filter.contributors?.length) {
      q.whereIn(Commits.col.author, filter.contributors)
    }

    if (filter.sourceApps?.length) {
      q.whereRaw(
        knex.raw(`?? ~* ?`, [
          Commits.col.sourceApplication,
          filter.sourceApps.join('|')
        ])
      )
    }
  }

  return q
}

export async function getPaginatedProjectModelsItems(
  projectId: string,
  params: ProjectModelsArgs
) {
  const { cursor, limit } = params

  const q = getPaginatedProjectModelsBaseQuery<BranchRecord[]>(projectId, params)
  q.limit(clamp(limit || 25, 1, 100)).orderBy(Branches.col.createdAt)

  if (cursor) q.andWhere(Branches.col.createdAt, '>', cursor)

  const results = await q
  return {
    items: results,
    cursor:
      results.length > 0 ? results[results.length - 1].createdAt.toISOString() : null
  }
}

export async function getPaginatedProjectModelsTotalCount(
  projectId: string,
  params: ProjectModelsArgs
) {
  const q = getPaginatedProjectModelsBaseQuery<{ count: string }[]>(projectId, params)
  q.clearSelect()
  q.count()

  const [res] = await q
  return parseInt(res?.count || '0')
}
