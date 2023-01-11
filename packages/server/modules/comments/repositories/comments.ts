import {
  CommentLinkRecord,
  CommentRecord,
  CommentLinkResourceType
} from '@/modules/comments/helpers/types'
import {
  BranchCommits,
  Branches,
  CommentLinks,
  Comments,
  Commits,
  knex
} from '@/modules/core/dbSchema'
import { ResourceIdentifier } from '@/modules/core/graph/generated/graphql'
import { MaybeNullOrUndefined, Optional } from '@/modules/shared/helpers/typeHelper'
import { clamp, keyBy, reduce } from 'lodash'
import crs from 'crypto-random-string'
import {
  BatchedSelectOptions,
  executeBatchedSelect
} from '@/modules/shared/helpers/dbHelper'
import { Knex } from 'knex'
import { decodeCursor, encodeCursor } from '@/modules/shared/helpers/graphqlHelper'

export const generateCommentId = () => crs({ length: 10 })

export type ExtendedComment = CommentRecord & {
  /**
   * comment_links resources for the comment
   */
  resources: Array<Omit<CommentLinkRecord, 'commentId'>>

  /**
   * If userId was specified, this will contain the last time the user
   * viewed this comment
   */
  viewedAt?: Date
}

/**
 * Get a single comment
 */
export async function getComment(params: { id: string; userId?: string }) {
  const { id, userId = null } = params

  const query = Comments.knex().select('*').joinRaw(`
        join(
          select cl."commentId" as id, JSON_AGG(json_build_object('resourceId', cl."resourceId", 'resourceType', cl."resourceType")) as resources
          from comment_links cl
          join comments on comments.id = cl."commentId"
          group by cl."commentId"
        ) res using(id)`)
  if (userId) {
    query.leftOuterJoin('comment_views', (b) => {
      b.on('comment_views.commentId', '=', 'comments.id')
      b.andOn('comment_views.userId', '=', knex.raw('?', userId))
    })
  }
  query.where({ id }).first()
  return (await query) as Optional<ExtendedComment>
}

/**
 * Get resources array for the specified comments. Results object is keyed by comment ID.
 */
export async function getCommentsResources(commentIds: string[]) {
  if (!commentIds.length) return {}

  const q = CommentLinks.knex()
    .select<{ commentId: string; resources: ResourceIdentifier[] }[]>([
      CommentLinks.col.commentId,
      knex.raw(
        `JSON_AGG(json_build_object('resourceId', "resourceId", 'resourceType', "resourceType")) as resources`
      )
    ])
    .whereIn(CommentLinks.col.commentId, commentIds)
    .groupBy(CommentLinks.col.commentId)

  const results = await q
  return keyBy(results, 'commentId')
}

type GetBatchedStreamCommentsOptions = BatchedSelectOptions & {
  /**
   * Filter out comments with parent comment references
   * Defaults to: false
   */
  withoutParentCommentOnly: boolean

  /**
   * Filter out comments without parent comment references
   * Defaults to: false
   */
  withParentCommentOnly: boolean
}

export function getBatchedStreamComments(
  streamId: string,
  options?: Partial<GetBatchedStreamCommentsOptions>
) {
  const { withoutParentCommentOnly = false, withParentCommentOnly = false } =
    options || {}

  const baseQuery = Comments.knex<CommentRecord[]>()
    .where(Comments.col.streamId, streamId)
    .orderBy(Comments.col.id)

  if (withoutParentCommentOnly) {
    baseQuery.andWhere(Comments.col.parentComment, null)
  } else if (withParentCommentOnly) {
    baseQuery.andWhereNot(Comments.col.parentComment, null)
  }

  return executeBatchedSelect(baseQuery, options)
}

export async function getCommentLinks(
  commentIds: string[],
  options?: Partial<{ trx: Knex.Transaction }>
) {
  const q = CommentLinks.knex<CommentLinkRecord[]>().whereIn(
    CommentLinks.col.commentId,
    commentIds
  )

  if (options?.trx) q.transacting(options.trx)

  return await q
}

export async function insertComments(
  comments: CommentRecord[],
  options?: Partial<{ trx: Knex.Transaction }>
) {
  const q = Comments.knex().insert(comments)
  if (options?.trx) q.transacting(options.trx)
  return await q
}

export async function insertCommentLinks(
  commentLinks: CommentLinkRecord[],
  options?: Partial<{ trx: Knex.Transaction }>
) {
  const q = CommentLinks.knex().insert(commentLinks)
  if (options?.trx) q.transacting(options.trx)
  return await q
}

export async function getStreamCommentCounts(
  streamIds: string[],
  options?: Partial<{ threadsOnly: boolean; includeArchived: boolean }>
) {
  if (!streamIds?.length) return []
  const { threadsOnly, includeArchived } = options || {}
  const q = Comments.knex()
    .select(Comments.col.streamId)
    .whereIn(Comments.col.streamId, streamIds)
    .andWhere(Comments.col.archived, false)
    .count()
    .groupBy(Comments.col.streamId)

  if (threadsOnly) {
    q.andWhere(Comments.col.parentComment, null)
  }

  if (!includeArchived) {
    q.andWhere(Comments.col.archived, false)
  }

  const results = (await q) as { streamId: string; count: string }[]
  return results.map((r) => ({ ...r, count: parseInt(r.count) }))
}

export async function getStreamCommentCount(
  streamId: string,
  options?: Partial<{ threadsOnly: boolean; includeArchived: boolean }>
) {
  const [res] = await getStreamCommentCounts([streamId], options)
  return res?.count || 0
}

export async function getBranchCommentCounts(
  branchIds: string[],
  options?: Partial<{ threadsOnly: boolean; includeArchived: boolean }>
) {
  if (!branchIds.length) return []
  const { threadsOnly, includeArchived } = options || {}

  const q = Branches.knex()
    .select(Branches.col.id)
    .whereIn(Branches.col.id, branchIds)
    .innerJoin(BranchCommits.name, BranchCommits.col.branchId, Branches.col.id)
    .innerJoin(CommentLinks.name, function () {
      this.on(CommentLinks.col.resourceId, BranchCommits.col.commitId).andOnVal(
        CommentLinks.col.resourceType,
        'commit' as CommentLinkResourceType
      )
    })
    .innerJoin(Comments.name, Comments.col.id, CommentLinks.col.commentId)
    .count()
    .groupBy(Branches.col.id)

  if (threadsOnly) {
    q.andWhere(Comments.col.parentComment, null)
  }

  if (!includeArchived) {
    q.andWhere(Comments.col.archived, false)
  }

  const results = (await q) as { id: string; count: string }[]
  return results.map((r) => ({ ...r, count: parseInt(r.count) }))
}

export async function getCommentReplyCounts(
  threadIds: string[],
  options?: Partial<{ includeArchived: boolean }>
) {
  if (!threadIds.length) return []
  const { includeArchived } = options || {}

  const q = Comments.knex()
    .select(Comments.col.parentComment)
    .whereIn(Comments.col.parentComment, threadIds)
    .count()
    .groupBy(Comments.col.parentComment)

  if (!includeArchived) {
    q.andWhere(Comments.col.archived, false)
  }

  const results = (await q) as { parentComment: string; count: string }[]
  return results.map((r) => ({ threadId: r.parentComment, count: parseInt(r.count) }))
}

export async function getCommentReplyAuthorIds(
  threadIds: string[],
  options?: Partial<{ includeArchived: boolean }>
) {
  if (!threadIds.length) return {}
  const { includeArchived } = options || {}

  const q = Comments.knex()
    .select([Comments.col.parentComment, Comments.col.authorId])
    .whereIn(Comments.col.parentComment, threadIds)
    .groupBy(Comments.col.parentComment, Comments.col.authorId)

  if (!includeArchived) {
    q.andWhere(Comments.col.archived, false)
  }

  const results = (await q) as { parentComment: string; authorId: string }[]
  return reduce(
    results,
    (result, item) => {
      ;(result[item.parentComment] || (result[item.parentComment] = [])).push(
        item.authorId
      )
      return result
    },
    {} as Record<string, string[]>
  )
}

export type PaginatedCommitCommentsParams = {
  commitId: string
  limit: number
  cursor?: MaybeNullOrUndefined<string>
  filter?: MaybeNullOrUndefined<{
    threadsOnly: boolean
    includeArchived: boolean
  }>
}

function getPaginatedCommitCommentsBaseQuery<T = CommentRecord[]>(
  params: Omit<PaginatedCommitCommentsParams, 'limit' | 'cursor'>
) {
  const { commitId, filter } = params

  const q = Commits.knex()
    .select<T>(Comments.cols)
    .innerJoin(CommentLinks.name, function () {
      this.on(CommentLinks.col.resourceId, Commits.col.id).andOnVal(
        CommentLinks.col.resourceType,
        'commit' as CommentLinkResourceType
      )
    })
    .innerJoin(Comments.name, Comments.col.id, CommentLinks.col.commentId)
    .where(Commits.col.id, commitId)

  if (!filter?.includeArchived) {
    q.andWhere(Comments.col.archived, false)
  }

  if (filter?.threadsOnly) {
    q.whereNull(Comments.col.parentComment)
  }

  return q
}

export async function getPaginatedCommitComments(
  params: PaginatedCommitCommentsParams
) {
  const { cursor } = params

  const limit = clamp(params.limit, 1, 100)
  const q = getPaginatedCommitCommentsBaseQuery(params)
    .orderBy(Comments.col.createdAt, 'desc')
    .limit(limit)

  if (cursor) {
    q.andWhere(Comments.col.createdAt, '<', decodeCursor(cursor))
  }

  const items = await q
  return {
    items,
    cursor: items.length
      ? encodeCursor(items[items.length - 1].createdAt.toISOString())
      : null
  }
}

export async function getPaginatedCommitCommentsTotalCount(
  params: Omit<PaginatedCommitCommentsParams, 'limit' | 'cursor'>
) {
  const baseQ = getPaginatedCommitCommentsBaseQuery(params)
  const q = knex.count<{ count: string }[]>().from(baseQ.as('sq1'))
  const [row] = await q

  return parseInt(row.count || '0')
}

export type PaginatedBranchCommentsParams = {
  branchId: string
  limit: number
  cursor?: MaybeNullOrUndefined<string>
  filter?: MaybeNullOrUndefined<{
    threadsOnly: boolean
    includeArchived: boolean
  }>
}

function getPaginatedBranchCommentsBaseQuery(
  params: Omit<PaginatedBranchCommentsParams, 'limit' | 'cursor'>
) {
  const { branchId, filter } = params

  const q = Branches.knex()
    .distinct()
    .select(Comments.cols)
    .innerJoin(BranchCommits.name, BranchCommits.col.branchId, Branches.col.id)
    .innerJoin(CommentLinks.name, function () {
      this.on(CommentLinks.col.resourceId, BranchCommits.col.commitId).andOnVal(
        CommentLinks.col.resourceType,
        'commit' as CommentLinkResourceType
      )
    })
    .innerJoin(Comments.name, Comments.col.id, CommentLinks.col.commentId)
    .where(Branches.col.id, branchId)

  if (!filter?.includeArchived) {
    q.andWhere(Comments.col.archived, false)
  }

  if (filter?.threadsOnly) {
    q.whereNull(Comments.col.parentComment)
  }

  return q
}

export async function getPaginatedBranchComments(
  params: PaginatedBranchCommentsParams
) {
  const { cursor } = params

  const limit = clamp(params.limit, 1, 100)
  const q = getPaginatedBranchCommentsBaseQuery(params)
    .orderBy(Comments.col.createdAt, 'desc')
    .limit(limit)

  if (cursor) {
    q.andWhere(Comments.col.createdAt, '<', decodeCursor(cursor))
  }

  const items = await q
  return {
    items,
    cursor: items.length
      ? encodeCursor(items[items.length - 1].createdAt.toISOString())
      : null
  }
}

export async function getPaginatedBranchCommentsTotalCount(
  params: Omit<PaginatedBranchCommentsParams, 'limit' | 'cursor'>
) {
  const baseQ = getPaginatedBranchCommentsBaseQuery(params)
  const q = knex.count<{ count: string }[]>().from(baseQ.as('sq1'))
  const [row] = await q

  return parseInt(row.count || '0')
}
