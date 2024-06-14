import knex from '@/db/knex'
import { clamp } from 'lodash'

// TODO: Make this more specific (find existing type?)
type ResourceIdentifier = { resourceId: string, resourceType: string }

/** One of `resources` or `streamId` expected. */
type GetCommentsParams = {
  resources?: (ResourceIdentifier | null)[] | null
  streamId?: string | null
  limit?: number
  cursor?: unknown
  userId?: string | null
  replies?: boolean
  archived?: boolean
}

/**
 * @deprecated Use `getPaginatedProjectComments()` instead
 */
export const getComments = async ({
  resources,
  limit,
  cursor,
  userId = null,
  replies = false,
  streamId,
  archived = false
}: GetCommentsParams) => {
  const query = knex.with('comms', (cte) => {
    cte.select().distinctOn('id').from('comments')
    cte.join('comment_links', 'comments.id', '=', 'commentId')

    if (userId) {
      // link viewed At
      cte.leftOuterJoin('comment_views', (b) => {
        b.on('comment_views.commentId', '=', 'comments.id')
        b.andOn('comment_views.userId', '=', knex.raw('?', userId))
      })
    }

    if (resources && resources.length !== 0) {
      cte.where((q) => {
        // link resources
        for (const res of resources) {
          q.orWhere('comment_links.resourceId', '=', res!.resourceId)
        }
      })
    } else {
      cte.where({ streamId })
    }
    if (!replies) {
      cte.whereNull('parentComment')
    }
    cte.where('archived', '=', archived)
  })

  query.select().from('comms')

  // total count coming from our cte
  query.joinRaw('right join (select count(*) from comms) c(total_count) on true')

  // get comment's all linked resources
  query.joinRaw(`
      join(
        select cl."commentId" as id, JSON_AGG(json_build_object('resourceId', cl."resourceId", 'resourceType', cl."resourceType")) as resources
        from comment_links cl
        join comms on comms.id = cl."commentId"
        group by cl."commentId"
      ) res using(id)`)

  if (cursor) {
    query.where('createdAt', '<', cursor)
  }

  limit = clamp(limit ?? 10, 0, 100)
  query.orderBy('createdAt', 'desc')
  query.limit(limit || 1) // need at least 1 row to get totalCount

  const rows = await query
  const totalCount = rows && rows.length > 0 ? parseInt(rows[0].total_count) : 0
  const nextCursor = rows && rows.length > 0 ? rows[rows.length - 1].createdAt : null

  return {
    items: !limit ? [] : rows,
    cursor: nextCursor ? nextCursor.toISOString() : null,
    totalCount
  }
}