import {
  BranchCommits,
  Branches,
  Commits,
  knex,
  StreamAcl,
  StreamCommits,
  Streams
} from '@/modules/core/dbSchema'
import {
  BranchCommitRecord,
  BranchRecord,
  CommitRecord,
  StreamCommitRecord
} from '@/modules/core/helpers/types'
import { clamp, uniq, uniqBy, reduce, keyBy, mapValues } from 'lodash'
import crs from 'crypto-random-string'
import {
  BatchedSelectOptions,
  executeBatchedSelect
} from '@/modules/shared/helpers/dbHelper'
import { Knex } from 'knex'
import { Nullable, Optional } from '@speckle/shared'
import { CommitWithStreamBranchMetadata } from '@/modules/core/domain/commits/types'
import {
  StoreCommit,
  DeleteCommit,
  DeleteCommits,
  GetCommit,
  GetCommits,
  GetSpecificBranchCommits,
  InsertBranchCommits,
  InsertStreamCommits
} from '@/modules/core/domain/commits/operations'

const tables = {
  commits: (db: Knex) => db<CommitRecord>(Commits.name),
  branchCommits: (db: Knex) => db<BranchCommitRecord>(BranchCommits.name),
  streamCommits: (db: Knex) => db<StreamCommitRecord>(StreamCommits.name)
}

export const generateCommitId = () => crs({ length: 10 })

/**
 * Get commits with their stream and branch IDs
 */
export const getCommitsFactory =
  (deps: { db: Knex }): GetCommits =>
  async (commitIds: string[], options?: Partial<{ streamId: string }>) => {
    const { streamId } = options || {}

    const q = tables
      .commits(deps.db)
      .select<CommitWithStreamBranchMetadata[]>([
        ...Commits.cols,
        StreamCommits.col.streamId,
        BranchCommits.col.branchId,
        `${Branches.col.name} as branchName`
      ])
      .whereIn(Commits.col.id, commitIds)
      .leftJoin(StreamCommits.name, StreamCommits.col.commitId, Commits.col.id)
      .leftJoin(BranchCommits.name, BranchCommits.col.commitId, Commits.col.id)
      .innerJoin(Branches.name, Branches.col.id, BranchCommits.col.branchId)

    if (streamId) {
      q.andWhere(StreamCommits.col.streamId, streamId)
    }

    const rows = await q

    // in case the join tables have multiple values for each commit
    // (shouldnt happen, but the schema allows for it)
    const uniqueRows = uniqBy(rows, (r) => r.id)

    return uniqueRows
  }

export const getCommitFactory =
  (deps: { db: Knex }): GetCommit =>
  async (commitId: string, options?: Partial<{ streamId: string }>) => {
    const [commit] = await getCommitsFactory(deps)([commitId], options)
    return commit as Optional<typeof commit>
  }

/**
 * Move all commits to the specified branch
 * Note: Make sure to validate beforehand that the branch ID belongs to the
 * same stream etc. THIS DOESN'T DO ANY VALIDATION!
 * @returns The amount of commits that were moved
 */
export async function moveCommitsToBranch(commitIds: string[], branchId: string) {
  if (!commitIds?.length) return

  // delete old branch commits
  await BranchCommits.knex().whereIn(BranchCommits.col.commitId, commitIds).del()

  // insert new ones
  const inserts = await BranchCommits.knex().insert(
    commitIds.map(
      (cId): BranchCommitRecord => ({
        branchId,
        commitId: cId
      })
    ),
    '*'
  )

  return inserts.length
}

export const deleteCommitsFactory =
  (deps: { db: Knex }): DeleteCommits =>
  async (commitIds: string[]) => {
    return await tables.commits(deps.db).whereIn(Commits.col.id, commitIds).del()
  }

export const deleteCommitFactory =
  (deps: { db: Knex }): DeleteCommit =>
  async (commitId: string) => {
    const delCount = await deleteCommitsFactory(deps)([commitId])
    return !!delCount
  }

export function getBatchedStreamCommits(
  streamId: string,
  options?: Partial<BatchedSelectOptions>
) {
  const baseQuery = Commits.knex<CommitRecord[]>()
    .select<CommitRecord[]>(Commits.cols)
    .innerJoin(StreamCommits.name, StreamCommits.col.commitId, Commits.col.id)
    .where(StreamCommits.col.streamId, streamId)
    .orderBy(Commits.col.id)

  return executeBatchedSelect(baseQuery, options)
}

export function getBatchedBranchCommits(
  branchIds: string[],
  options?: Partial<BatchedSelectOptions>
) {
  const baseQuery = BranchCommits.knex<BranchCommitRecord[]>()
    .whereIn(BranchCommits.col.branchId, branchIds)
    .orderBy(BranchCommits.col.branchId)

  return executeBatchedSelect(baseQuery, options)
}

export async function insertCommits(
  commits: CommitRecord[],
  options?: Partial<{ trx: Knex.Transaction }>
) {
  const q = Commits.knex().insert(commits)
  if (options?.trx) q.transacting(options.trx)
  return await q
}

export const insertStreamCommitsFactory =
  (deps: { db: Knex }): InsertStreamCommits =>
  async (
    streamCommits: StreamCommitRecord[],
    options?: Partial<{ trx: Knex.Transaction }>
  ) => {
    const q = tables.streamCommits(deps.db).insert(streamCommits)
    if (options?.trx) q.transacting(options.trx)
    return await q
  }

export const insertBranchCommitsFactory =
  (deps: { db: Knex }): InsertBranchCommits =>
  async (
    branchCommits: BranchCommitRecord[],
    options?: Partial<{ trx: Knex.Transaction }>
  ) => {
    const q = tables.branchCommits(deps.db).insert(branchCommits)
    if (options?.trx) q.transacting(options.trx)
    return await q
  }

export async function getStreamCommitCounts(
  streamIds: string[],
  options?: Partial<{ ignoreGlobalsBranch: boolean }>
) {
  if (!streamIds?.length) return []

  const { ignoreGlobalsBranch } = options || {}

  const q = StreamCommits.knex()
    .select(StreamCommits.col.streamId)
    .whereIn(StreamCommits.col.streamId, streamIds)
    .count()
    .groupBy(StreamCommits.col.streamId)

  if (ignoreGlobalsBranch) {
    q.innerJoin(
      BranchCommits.name,
      StreamCommits.col.commitId,
      BranchCommits.col.commitId
    )
      .innerJoin(Branches.name, Branches.col.id, BranchCommits.col.branchId)
      .andWhereNot(Branches.col.name, 'globals')
  }

  const results = (await q) as { streamId: string; count: string }[]
  return results.map((r) => ({ ...r, count: parseInt(r.count) }))
}

export async function getStreamCommitCount(
  streamId: string,
  options?: Partial<{ ignoreGlobalsBranch: boolean }>
) {
  const [res] = await getStreamCommitCounts([streamId], options)
  return res?.count || 0
}

export async function getCommitsAndTheirBranchIds(commitIds: string[]) {
  if (!commitIds.length) return []

  return await Commits.knex()
    .select<Array<CommitRecord & { branchId: string }>>([
      ...Commits.cols,
      BranchCommits.col.branchId
    ])
    .innerJoin(BranchCommits.name, BranchCommits.col.commitId, Commits.col.id)
    .whereIn(Commits.col.id, commitIds)
}

export const getSpecificBranchCommitsFactory =
  (deps: { db: Knex }): GetSpecificBranchCommits =>
  async (pairs: { branchId: string; commitId: string }[]) => {
    if (!pairs?.length) return []

    const commitIds = uniq(pairs.map((p) => p.commitId))
    const branchIds = uniq(pairs.map((p) => p.branchId))

    const q = tables
      .commits(deps.db)
      .select<Array<CommitRecord & { branchId: string }>>([
        ...Commits.cols,
        BranchCommits.col.branchId
      ])
      .innerJoin(BranchCommits.name, BranchCommits.col.commitId, Commits.col.id)
      .whereIn(Commits.col.id, commitIds)
      .whereIn(BranchCommits.col.branchId, branchIds)

    const queryResults = await q
    const results: Array<CommitRecord & { branchId: string }> = []

    for (const pair of pairs) {
      const commit = queryResults.find(
        (r) => r.id === pair.commitId && r.branchId === pair.branchId
      )
      if (commit) {
        results.push(commit)
      }
    }

    return results
  }

export type PaginatedBranchCommitsBaseParams = {
  branchId: string
  filter?: Nullable<{
    /**
     * Exclude specific commits
     */
    excludeIds?: string[]
  }>
}

export type PaginatedBranchCommitsParams = PaginatedBranchCommitsBaseParams & {
  limit: number
  cursor?: Nullable<string>
}

function getPaginatedBranchCommitsBaseQuery<T = CommitRecord[]>(
  params: PaginatedBranchCommitsBaseParams
) {
  const { branchId, filter } = params

  const q = Commits.knex<T>()
    .select(Commits.cols)
    .innerJoin(BranchCommits.name, BranchCommits.col.commitId, Commits.col.id)
    .innerJoin(Branches.name, Branches.col.id, BranchCommits.col.branchId)
    .where(Branches.col.id, branchId)
    .groupBy(Commits.col.id)

  if (filter?.excludeIds?.length) {
    q.whereNotIn(Commits.col.id, filter.excludeIds)
  }

  return q
}

export async function getPaginatedBranchCommits(params: PaginatedBranchCommitsParams) {
  const { cursor } = params

  const limit = clamp(params.limit || 25, 1, 100)
  const q = getPaginatedBranchCommitsBaseQuery(params)
    .orderBy(Commits.col.createdAt, 'desc')
    .limit(limit)

  if (cursor) {
    q.andWhere(Commits.col.createdAt, '<', cursor)
  }

  const rows = await q

  return {
    commits: rows,
    cursor: rows.length > 0 ? rows[rows.length - 1].createdAt.toISOString() : null
  }
}

export async function getBranchCommitsTotalCount(
  params: PaginatedBranchCommitsBaseParams
) {
  const baseQ = getPaginatedBranchCommitsBaseQuery(params)
  const q = knex.count<{ count: string }[]>().from(baseQ.as('sq1'))

  const [res] = await q
  return parseInt(res?.count || '0')
}

export async function getCommitBranches(commitIds: string[]) {
  if (!commitIds?.length) return []

  const q = BranchCommits.knex()
    .select<Array<BranchRecord & { commitId: string }>>([
      ...Branches.cols,
      knex.raw(`?? as "commitId"`, [BranchCommits.col.commitId])
    ])
    .innerJoin(Branches.name, Branches.col.id, BranchCommits.col.branchId)
    .whereIn(BranchCommits.col.commitId, commitIds)

  return await q
}

export async function getCommitBranch(commitId: string) {
  const [commit] = await getCommitBranches([commitId])
  return commit as Optional<typeof commit>
}

export async function switchCommitBranch(
  commitId: string,
  newBranchId: string,
  oldBranchId?: string
) {
  const q = BranchCommits.knex()
    .where(BranchCommits.col.commitId, commitId)
    .update(BranchCommits.withoutTablePrefix.col.branchId, newBranchId)

  if (oldBranchId) {
    q.andWhere(BranchCommits.col.branchId, oldBranchId)
  }

  await q
}

export async function updateCommit(commitId: string, commit: Partial<CommitRecord>) {
  const [newCommit] = (await Commits.knex()
    .where(Commits.col.id, commitId)
    .update(commit, '*')) as CommitRecord[]
  return newCommit
}

export const createCommitFactory =
  (deps: { db: Knex }): StoreCommit =>
  async (
    params: Omit<CommitRecord, 'id' | 'createdAt'> & {
      message?: Nullable<string>
    }
  ) => {
    const [item] = await tables.commits(deps.db).insert(
      {
        ...params,
        id: generateCommitId()
      },
      '*'
    )
    return item
  }

export async function getObjectCommitsWithStreamIds(
  objectIds: string[],
  options?: {
    /**
     * Optionally also filter by stream ids
     */
    streamIds?: string[]
  }
) {
  if (!objectIds?.length) return []
  const { streamIds } = options || {}

  const q = Commits.knex()
    .select<Array<CommitRecord & { streamId: string }>>([
      ...Commits.cols,
      StreamCommits.col.streamId
    ])
    .whereIn(Commits.col.referencedObject, objectIds)
    .innerJoin(StreamCommits.name, StreamCommits.col.commitId, Commits.col.id)

  if (streamIds?.length) {
    q.whereIn(StreamCommits.col.streamId, streamIds)
  }

  return await q
}

export async function getAllBranchCommits(params: {
  branchIds?: string[]
  projectId?: string
}): Promise<Record<string, CommitRecord[]>> {
  const { branchIds, projectId } = params
  if (!branchIds?.length && !projectId) return {}

  const q = BranchCommits.knex()
    .select<Array<CommitRecord & { branchId: string }>>([
      ...Commits.cols,
      BranchCommits.col.branchId
    ])
    .innerJoin(Commits.name, Commits.col.id, BranchCommits.col.commitId)

  if (branchIds?.length) {
    q.whereIn(BranchCommits.col.branchId, branchIds)
  }

  if (projectId) {
    q.innerJoin(Branches.name, Branches.col.id, BranchCommits.col.branchId)
    q.andWhere(Branches.col.streamId, projectId)
  }

  const res = await q
  return reduce(
    res,
    (res, item) => {
      const branchId = item.branchId
      ;(res[branchId] = res[branchId] || []).push(item)
      return res
    },
    {} as Record<string, CommitRecord[]>
  )
}

export async function getUserStreamCommitCounts(params: {
  userIds: string[]
  /**
   * Only include commits from public/discoverable streams
   */
  publicOnly?: boolean
}) {
  const { userIds, publicOnly } = params
  if (!userIds?.length) return {}

  const q = StreamAcl.knex()
    .select<{ userId: string; count: string }[]>([
      StreamAcl.col.userId,
      knex.raw('COUNT(*)')
    ])
    .join(StreamCommits.name, StreamCommits.col.streamId, StreamAcl.col.resourceId)
    .whereIn(StreamAcl.col.userId, userIds)
    .groupBy(StreamAcl.col.userId)

  if (publicOnly) {
    q.join(Streams.name, Streams.col.id, StreamAcl.col.resourceId)
    q.andWhere((q1) => {
      q1.where(Streams.col.isPublic, true).orWhere(Streams.col.isDiscoverable, true)
    })
  }

  const res = await q
  return mapValues(keyBy(res, 'userId'), (r) => parseInt(r.count))
}

export async function getUserAuthoredCommitCounts(params: {
  userIds: string[]
  /**
   * Only include commits from public/discoverable streams
   */
  publicOnly?: boolean
}) {
  const { userIds, publicOnly } = params
  if (!userIds?.length) return {}

  const q = Commits.knex()
    .select<{ authorId: string; count: string }[]>([
      Commits.col.author,
      knex.raw('COUNT(*)')
    ])
    .whereIn(Commits.col.author, userIds)
    .groupBy(Commits.col.author)

  if (publicOnly) {
    q.join(StreamCommits.name, StreamCommits.col.commitId, Commits.col.id)
    q.join(Streams.name, Streams.col.id, StreamCommits.col.streamId)
    q.andWhere((q1) => {
      q1.where(Streams.col.isPublic, true).orWhere(Streams.col.isDiscoverable, true)
    })
  }

  const res = await q
  return mapValues(keyBy(res, 'author'), (r) => parseInt(r.count))
}
