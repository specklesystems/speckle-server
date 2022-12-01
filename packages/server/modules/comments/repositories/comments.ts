import { CommentLinkRecord, CommentRecord } from '@/modules/comments/helpers/types'
import { CommentLinks, Comments, knex } from '@/modules/core/dbSchema'
import { ResourceIdentifier } from '@/modules/core/graph/generated/graphql'
import { Optional } from '@/modules/shared/helpers/typeHelper'
import { keyBy } from 'lodash'
import crs from 'crypto-random-string'
import {
  BatchedSelectOptions,
  executeBatchedSelect
} from '@/modules/shared/helpers/dbHelper'

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

export async function getCommentLinks(commentIds: string[]) {
  const q = CommentLinks.knex<CommentLinkRecord[]>().whereIn(
    CommentLinks.col.commentId,
    commentIds
  )

  return await q
}

export async function insertComments(comments: CommentRecord[]) {
  return await Comments.knex().insert(comments)
}

export async function insertCommentLinks(commentLinks: CommentLinkRecord[]) {
  return await CommentLinks.knex().insert(commentLinks)
}
