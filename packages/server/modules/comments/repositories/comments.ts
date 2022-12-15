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
  knex
} from '@/modules/core/dbSchema'
import { ResourceIdentifier } from '@/modules/core/graph/generated/graphql'
import { Optional } from '@/modules/shared/helpers/typeHelper'
import { keyBy, reduce } from 'lodash'
import crs from 'crypto-random-string'
import {
  BatchedSelectOptions,
  executeBatchedSelect
} from '@/modules/shared/helpers/dbHelper'
import { Knex } from 'knex'

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
