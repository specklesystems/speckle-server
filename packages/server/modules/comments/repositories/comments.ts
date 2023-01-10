import { CommentLinkRecord, CommentRecord } from '@/modules/comments/helpers/types'
import { CommentLinks, Comments, knex } from '@/modules/core/dbSchema'
import { ResourceIdentifier } from '@/modules/core/graph/generated/graphql'
import { Optional } from '@/modules/shared/helpers/typeHelper'
import { keyBy } from 'lodash'

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
