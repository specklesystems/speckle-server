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
  StreamAclRecord,
  StreamCommitRecord
} from '@/modules/core/helpers/types'
import { clamp, uniq, uniqBy, reduce, keyBy, mapValues } from 'lodash'
import crs from 'crypto-random-string'
import {
  BatchedSelectOptions,
  executeBatchedSelect
} from '@/modules/shared/helpers/dbHelper'
import { Knex } from 'knex'
import { MaybeNullOrUndefined, Optional } from '@speckle/shared'
import {
  CommitWithStreamBranchId,
  CommitWithStreamBranchMetadata,
  LegacyStreamCommit,
  LegacyUserCommit
} from '@/modules/core/domain/commits/types'
import {
  StoreCommit,
  DeleteCommit,
  DeleteCommits,
  GetCommit,
  GetCommits,
  GetSpecificBranchCommits,
  InsertBranchCommits,
  InsertStreamCommits,
  GetCommitBranches,
  GetCommitBranch,
  SwitchCommitBranch,
  UpdateCommit,
  GetAllBranchCommits,
  GetStreamCommitCounts,
  GetStreamCommitCount,
  GetUserStreamCommitCounts,
  GetUserAuthoredCommitCounts,
  GetCommitsAndTheirBranchIds,
  GetBatchedStreamCommits,
  GetBatchedBranchCommits,
  InsertCommits,
  GetObjectCommitsWithStreamIds,
  PaginatedBranchCommitsBaseParams,
  PaginatedBranchCommitsParams,
  GetPaginatedBranchCommitsItems,
  GetBranchCommitsTotalCount,
  MoveCommitsToBranch,
  LegacyGetPaginatedUserCommitsPage,
  LegacyGetPaginatedUserCommitsTotalCount,
  LegacyGetPaginatedStreamCommitsPage
} from '@/modules/core/domain/commits/operations'

const tables = {
  commits: (db: Knex) => db<CommitRecord>(Commits.name),
  branchCommits: <T extends object = BranchCommitRecord>(db: Knex) =>
    db<T>(BranchCommits.name),
  streamCommits: (db: Knex) => db<StreamCommitRecord>(StreamCommits.name),
  streamAcl: (db: Knex) => db<StreamAclRecord>(StreamAcl.name)
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
export const moveCommitsToBranchFactory =
  (deps: { db: Knex }): MoveCommitsToBranch =>
  async (commitIds: string[], branchId: string) => {
    if (!commitIds?.length) return

    // delete old branch commits
    await tables
      .branchCommits(deps.db)
      .whereIn(BranchCommits.col.commitId, commitIds)
      .del()

    // insert new ones
    const inserts = await tables.branchCommits(deps.db).insert(
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

export const getBatchedStreamCommitsFactory =
  (deps: { db: Knex }): GetBatchedStreamCommits =>
  (streamId: string, options?: Partial<BatchedSelectOptions>) => {
    const baseQuery = tables
      .commits(deps.db)
      .select<CommitRecord[]>(Commits.cols)
      .innerJoin(StreamCommits.name, StreamCommits.col.commitId, Commits.col.id)
      .where(StreamCommits.col.streamId, streamId)
      .orderBy(Commits.col.id)

    return executeBatchedSelect(baseQuery, options)
  }

export const getBatchedBranchCommitsFactory =
  (deps: { db: Knex }): GetBatchedBranchCommits =>
  (branchIds: string[], options?: Partial<BatchedSelectOptions>) => {
    const baseQuery = tables
      .branchCommits<BranchCommitRecord & { streamId: string }>(deps.db)
      .select<(BranchCommitRecord & { streamId: string })[]>([
        ...BranchCommits.cols,
        StreamCommits.col.streamId
      ])
      .whereIn(BranchCommits.col.branchId, branchIds)
      .orderBy(BranchCommits.col.branchId)

    return executeBatchedSelect<
      BranchCommitRecord & { streamId: string },
      (BranchCommitRecord & { streamId: string })[]
    >(baseQuery, options)
  }

export const insertCommitsFactory =
  (deps: { db: Knex }): InsertCommits =>
  async (commits: CommitRecord[], options?: Partial<{ trx: Knex.Transaction }>) => {
    const q = tables.commits(deps.db).insert(commits)
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

export const getStreamCommitCountsFactory =
  (deps: { db: Knex }): GetStreamCommitCounts =>
  async (streamIds: string[], options?: Partial<{ ignoreGlobalsBranch: boolean }>) => {
    if (!streamIds?.length) return []

    const { ignoreGlobalsBranch } = options || {}

    const q = tables
      .streamCommits(deps.db)
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

export const getStreamCommitCountFactory =
  (deps: { db: Knex }): GetStreamCommitCount =>
  async (streamId: string, options?: Partial<{ ignoreGlobalsBranch: boolean }>) => {
    const [res] = await getStreamCommitCountsFactory(deps)([streamId], options)
    return res?.count || 0
  }

export const getCommitsAndTheirBranchIdsFactory =
  (deps: { db: Knex }): GetCommitsAndTheirBranchIds =>
  async (commitIds: string[]) => {
    if (!commitIds.length) return []

    return await tables
      .commits(deps.db)
      .select<Array<CommitWithStreamBranchId>>([
        ...Commits.cols,
        knex.raw(`(array_agg(??))[1] as "branchId"`, [BranchCommits.col.branchId]),
        knex.raw(`(array_agg(??))[1] as "streamId"`, [StreamCommits.col.streamId])
      ])
      .innerJoin(BranchCommits.name, BranchCommits.col.commitId, Commits.col.id)
      .innerJoin(StreamCommits.name, StreamCommits.col.commitId, Commits.col.id)
      .groupBy(Commits.col.id)
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
      .select<Array<CommitWithStreamBranchId>>([
        ...Commits.cols,
        knex.raw(`(array_agg(??))[1] as "branchId"`, [BranchCommits.col.branchId]),
        knex.raw(`(array_agg(??))[1] as "streamId"`, [StreamCommits.col.streamId])
      ])
      .innerJoin(BranchCommits.name, BranchCommits.col.commitId, Commits.col.id)
      .innerJoin(StreamCommits.name, StreamCommits.col.commitId, Commits.col.id)
      .whereIn(Commits.col.id, commitIds)
      .whereIn(BranchCommits.col.branchId, branchIds)
      .groupBy(Commits.col.id)

    const queryResults = await q
    const results: Array<CommitWithStreamBranchId> = []

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

const getPaginatedBranchCommitsBaseQueryFactory =
  (deps: { db: Knex }) =>
  <T = CommitWithStreamBranchId[]>(params: PaginatedBranchCommitsBaseParams) => {
    const { branchId, filter } = params

    const q = tables
      .commits(deps.db)
      .select<T>([
        ...Commits.cols,
        knex.raw(`(array_agg(??))[1] as "branchId"`, [BranchCommits.col.branchId]),
        knex.raw(`(array_agg(??))[1] as "streamId"`, [StreamCommits.col.streamId])
      ])
      .innerJoin(BranchCommits.name, BranchCommits.col.commitId, Commits.col.id)
      .innerJoin(StreamCommits.name, StreamCommits.col.commitId, Commits.col.id)
      .innerJoin(Branches.name, Branches.col.id, BranchCommits.col.branchId)
      .where(Branches.col.id, branchId)
      .groupBy(Commits.col.id)

    if (filter?.excludeIds?.length) {
      q.whereNotIn(Commits.col.id, filter.excludeIds)
    }

    return q
  }

export const getPaginatedBranchCommitsItemsFactory =
  (deps: { db: Knex }): GetPaginatedBranchCommitsItems =>
  async (params: PaginatedBranchCommitsParams) => {
    const { cursor } = params

    const limit = clamp(params.limit || 25, 1, 100)
    const q = getPaginatedBranchCommitsBaseQueryFactory(deps)(params)
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

export const getBranchCommitsTotalCountFactory =
  (deps: { db: Knex }): GetBranchCommitsTotalCount =>
  async (params: PaginatedBranchCommitsBaseParams) => {
    const baseQ = getPaginatedBranchCommitsBaseQueryFactory(deps)(params)
    const q = deps.db.count<{ count: string }[]>().from(baseQ.as('sq1'))

    const [res] = await q
    return parseInt(res?.count || '0')
  }

export const getCommitBranchesFactory =
  (deps: { db: Knex }): GetCommitBranches =>
  async (commitIds: string[]) => {
    if (!commitIds?.length) return []

    const q = tables
      .branchCommits(deps.db)
      .select<Array<BranchRecord & { commitId: string }>>([
        ...Branches.cols,
        knex.raw(`?? as "commitId"`, [BranchCommits.col.commitId])
      ])
      .innerJoin(Branches.name, Branches.col.id, BranchCommits.col.branchId)
      .whereIn(BranchCommits.col.commitId, commitIds)

    return await q
  }

export const getCommitBranchFactory =
  (deps: { db: Knex }): GetCommitBranch =>
  async (commitId: string) => {
    const [commit] = await getCommitBranchesFactory(deps)([commitId])
    return commit as Optional<typeof commit>
  }

export const switchCommitBranchFactory =
  (deps: { db: Knex }): SwitchCommitBranch =>
  async (commitId: string, newBranchId: string, oldBranchId?: string) => {
    const q = tables
      .branchCommits(deps.db)
      .where(BranchCommits.col.commitId, commitId)
      .update(BranchCommits.withoutTablePrefix.col.branchId, newBranchId)

    if (oldBranchId) {
      q.andWhere(BranchCommits.col.branchId, oldBranchId)
    }

    await q
  }

export const updateCommitFactory =
  (deps: { db: Knex }): UpdateCommit =>
  async (commitId: string, commit: Partial<CommitRecord>) => {
    const [newCommit] = (await tables
      .commits(deps.db)
      .where(Commits.col.id, commitId)
      .update(commit, '*')) as CommitRecord[]
    return newCommit
  }

export const createCommitFactory =
  (deps: { db: Knex }): StoreCommit =>
  async (params) => {
    const [item] = await tables.commits(deps.db).insert(
      {
        ...params,
        id: generateCommitId()
      },
      '*'
    )
    return item
  }

export const getObjectCommitsWithStreamIdsFactory =
  (deps: { db: Knex }): GetObjectCommitsWithStreamIds =>
  async (
    objectIds: string[],
    options?: {
      /**
       * Optionally also filter by stream ids
       */
      streamIds?: string[]
    }
  ) => {
    if (!objectIds?.length) return []
    const { streamIds } = options || {}

    const q = tables
      .commits(deps.db)
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

export const getAllBranchCommitsFactory =
  (deps: { db: Knex }): GetAllBranchCommits =>
  async (params: {
    branchIds?: string[]
    projectId?: string
  }): Promise<Record<string, CommitRecord[]>> => {
    const { branchIds, projectId } = params
    if (!branchIds?.length && !projectId) return {}

    const q = tables
      .branchCommits(deps.db)
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

export const getUserStreamCommitCountsFactory =
  (deps: { db: Knex }): GetUserStreamCommitCounts =>
  async (params: {
    userIds: string[]
    /**
     * Only include commits from public/discoverable streams
     */
    publicOnly?: boolean
  }) => {
    const { userIds, publicOnly } = params
    if (!userIds?.length) return {}

    const q = tables
      .streamAcl(deps.db)
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

export const getUserAuthoredCommitCountsFactory =
  (deps: { db: Knex }): GetUserAuthoredCommitCounts =>
  async (params: {
    userIds: string[]
    /**
     * Only include commits from public/discoverable streams
     */
    publicOnly?: boolean
  }) => {
    const { userIds, publicOnly } = params
    if (!userIds?.length) return {}

    const q = tables
      .commits(deps.db)
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

/**
 * @deprecated Deprecated because of the weird/messy commit structure. It should return CommitRecords
 * without any joins, and let those be handled by GQL dataloaders
 */
const getCommitsByUserIdBaseFactory =
  (deps: { db: Knex }) =>
  ({
    userId,
    publicOnly,
    streamIdWhitelist
  }: {
    userId: string
    publicOnly?: MaybeNullOrUndefined<boolean>
    streamIdWhitelist?: MaybeNullOrUndefined<string[]>
  }) => {
    publicOnly = publicOnly !== false

    const query = tables
      .commits(deps.db)
      .columns([
        { id: 'commits.id' },
        'message',
        'referencedObject',
        'sourceApplication',
        'totalChildrenCount',
        'parents',
        'commits.createdAt',
        { branchName: 'branches.name' },
        { streamId: 'stream_commits.streamId' },
        { streamName: 'streams.name' },
        { authorName: 'users.name' },
        { authorId: 'users.id' },
        { authorAvatar: 'users.avatar' }
      ])
      .select()
      .join('stream_commits', 'commits.id', 'stream_commits.commitId')
      .join('streams', 'stream_commits.streamId', 'streams.id')
      .join('branch_commits', 'commits.id', 'branch_commits.commitId')
      .join('branches', 'branches.id', 'branch_commits.branchId')
      .leftJoin('users', 'commits.author', 'users.id')
      .where('author', userId)

    if (publicOnly) query.andWhere('streams.isPublic', true)
    if (streamIdWhitelist?.length) query.whereIn('streams.streamId', streamIdWhitelist)

    return query
  }

/**
 * @deprecated Deprecated because of the weird/messy commit structure. It should return CommitRecords
 * without any joins, and let those be handled by GQL dataloaders
 */
export const legacyGetPaginatedUserCommitsPage =
  (deps: { db: Knex }): LegacyGetPaginatedUserCommitsPage =>
  async ({ userId, limit, cursor, publicOnly, streamIdWhitelist }) => {
    limit = limit || 25
    publicOnly = publicOnly !== false

    const query = getCommitsByUserIdBaseFactory(deps)({
      userId,
      publicOnly,
      streamIdWhitelist
    })

    if (cursor) query.andWhere('commits.createdAt', '<', cursor)

    query.orderBy('commits.createdAt', 'desc').limit(limit)

    const rows = (await query) as LegacyUserCommit[]
    return {
      commits: rows,
      cursor: rows.length > 0 ? rows[rows.length - 1].createdAt.toISOString() : null
    }
  }

/**
 * @deprecated Deprecated because of the weird/messy commit structure. It should return CommitRecords
 * without any joins, and let those be handled by GQL dataloaders
 */
export const legacyGetPaginatedUserCommitsTotalCount =
  (deps: { db: Knex }): LegacyGetPaginatedUserCommitsTotalCount =>
  async ({ userId, publicOnly, streamIdWhitelist }) => {
    const query = getCommitsByUserIdBaseFactory(deps)({
      userId,
      publicOnly,
      streamIdWhitelist
    })
    query.clearSelect()
    query.select(knex.raw('COUNT(*) as count'))

    const [res] = (await query) as Array<{ count: string }>
    return parseInt(res.count)
  }

/**
 * @deprecated Deprecated because of the weird/messy commit structure. It should return CommitRecords
 * without any joins, and let those be handled by GQL dataloaders
 */
export const legacyGetPaginatedStreamCommitsPageFactory =
  (deps: { db: Knex }): LegacyGetPaginatedStreamCommitsPage =>
  async ({ streamId, limit, cursor, ignoreGlobalsBranch }) => {
    limit = clamp(limit || 25, 0, 100)
    if (!limit) return { commits: [], cursor: null }

    const query = tables
      .streamCommits(deps.db)
      .columns([
        { id: 'commits.id' },
        'stream_commits.streamId',
        'message',
        'referencedObject',
        'sourceApplication',
        'totalChildrenCount',
        'parents',
        'commits.createdAt',
        { branchName: 'branches.name' },
        { authorName: 'users.name' },
        { authorId: 'users.id' },
        { authorAvatar: 'users.avatar' },
        { streamId: 'stream_commits.streamId' },
        knex.raw(`?? as "author"`, ['users.id'])
      ])
      .select()
      .join('commits', 'commits.id', 'stream_commits.commitId')
      .join('branch_commits', 'commits.id', 'branch_commits.commitId')
      .join('branches', 'branches.id', 'branch_commits.branchId')
      .leftJoin('users', 'commits.author', 'users.id')
      .where('stream_commits.streamId', streamId)

    if (ignoreGlobalsBranch) query.andWhere('branches.name', '!=', 'globals')

    if (cursor) query.andWhere('commits.createdAt', '<', cursor)

    query.orderBy('commits.createdAt', 'desc').limit(limit)

    const rows = (await query) as LegacyStreamCommit[]
    return {
      commits: rows,
      cursor: rows.length > 0 ? rows[rows.length - 1].createdAt.toISOString() : null
    }
  }
