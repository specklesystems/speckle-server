'use strict'
import _ from 'lodash'
import { Streams, StreamAcl, knex } from '@/modules/core/dbSchema'
import {
  getFavoritedStreams,
  getFavoritedStreamsCount,
  canUserFavoriteStream,
  updateStream as updateStreamInDb,
  deleteStream as deleteStreamFromDb,
  grantStreamPermissions,
  revokeStreamPermissions,
  getStream,
  setStreamFavorited
} from '@/modules/core/repositories/streams'
export { getStream, setStreamFavorited } from '@/modules/core/repositories/streams'
import { UnauthorizedError, InvalidArgumentError } from '@/modules/shared/errors'
import { dbLogger } from '@/logging/logging'
import { createStreamReturnRecord } from '@/modules/core/services/streams/management'
import {
  ProjectCreateInput,
  ProjectUpdateInput,
  StreamCreateInput,
  StreamUpdateInput
} from '@/modules/core/graph/generated/graphql'
import { StreamRoles } from '@speckle/shared'
import { AuthContext } from '@/modules/shared/authz'
import type { Knex } from 'knex'

/**
 * NOTE: Stop adding stuff to this service, create specialized service modules instead for various domains
 * relating to streams. Otherwise we're not only breaking the single responsibility principle, but also
 * increasing the chances of circular dependencies (which often cause actual errors) since everything relies
 * on this service.
 */

type StreamCreateParams = (StreamCreateInput | ProjectCreateInput) & { ownerId: string }
type StreamUpdateParams = StreamUpdateInput | ProjectUpdateInput

/**
 * @deprecated Use createStreamReturnRecord()
 * @param {import('@/modules/core/graph/generated/graphql').StreamCreateInput & {ownerId: string}} param0
 * @returns {Promise<string>}
 */
export async function createStream(params: StreamCreateParams) {
  const { id } = await createStreamReturnRecord(params, {
    createActivity: false
  })
  return id
}

/**
 * @deprecated Use updateStreamAndNotify or use the repository function directly
 * @param {import('@/modules/core/graph/generated/graphql').StreamUpdateInput} update
 */
export async function updateStream(update: StreamUpdateParams) {
  const updatedStream = await updateStreamInDb(update)
  return updatedStream?.id || null
}

/**
 * @deprecated Use repository method directly
 */
export async function grantPermissionsStream({
  streamId,
  userId,
  role
}: {
  streamId: string
  userId: string
  role: StreamRoles
}) {
  return await grantStreamPermissions({ streamId, userId, role })
}

/**
 * @deprecated Use repository method directly
 */
export async function revokePermissionsStream({
  streamId,
  userId
}: {
  streamId: string
  userId: string
}) {
  return await revokeStreamPermissions({ streamId, userId })
}

/**
 * @deprecated Use deleteStreamAndNotify or use the repository function directly
 */
export async function deleteStream({ streamId }: { streamId: string }) {
  dbLogger.info('Deleting stream %s', streamId)
  return await deleteStreamFromDb(streamId)
}

export async function getStreams({
  cursor,
  limit,
  orderBy,
  visibility,
  searchQuery
}: {
  cursor: Date | null
  limit: number
  orderBy: string | null
  visibility: string | null
  searchQuery: string | null
}) {
  const query = knex.select().from('streams')

  const countQuery = Streams.knex()

  if (searchQuery) {
    const whereFunc = function (qb: Knex.QueryBuilder) {
      qb.where('streams.name', 'ILIKE', `%${searchQuery}%`).orWhere(
        'streams.description',
        'ILIKE',
        `%${searchQuery}%`
      )
    }
    query.where(whereFunc)
    countQuery.where(whereFunc)
  }
  if (visibility && visibility !== 'all') {
    if (!['private', 'public'].includes(visibility))
      throw new Error('Stream visibility should be either private, public or all')
    const isPublic = visibility === 'public'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const publicFunc = function (this: any) {
      this.where({ isPublic })
    }
    query.andWhere(publicFunc)
    countQuery.andWhere(publicFunc)
  }
  const [res] = await countQuery.count()
  const count = parseInt(res.count)

  if (!count) return { streams: [], totalCount: 0 }

  orderBy = orderBy || 'updatedAt,desc'

  const [columnName, order] = orderBy.split(',')

  if (cursor) query.where(columnName, order === 'desc' ? '<' : '>', cursor)

  const rows = await query.orderBy(`${columnName}`, order).limit(limit)

  const cursorDate = rows.length ? rows.slice(-1)[0][columnName] : null
  return { streams: rows, totalCount: count, cursorDate }
}

export async function getStreamUsers({ streamId }: { streamId: string }) {
  const query = StreamAcl.knex()
    .columns({ role: 'stream_acl.role' }, 'id', 'name', 'company', 'avatar')
    .select()
    .where({ resourceId: streamId })
    .rightJoin('users', { 'users.id': 'stream_acl.userId' })
    .select('stream_acl.role', 'name', 'id', 'company', 'avatar')
    .orderBy('stream_acl.role')

  return await query
}

/**
 * Favorite or unfavorite a stream
 * @param {Object} p
 * @param {string} p.userId
 * @param {string} p.streamId
 * @param {boolean} [p.favorited] Whether to favorite or unfavorite (true by default)
 * @returns {Promise<Object>} Updated stream
 */
export async function favoriteStream({
  userId,
  streamId,
  favorited
}: {
  userId: string
  streamId: string
  favorited?: boolean
}) {
  // Check if user has access to stream
  if (!(await canUserFavoriteStream({ userId, streamId }))) {
    throw new UnauthorizedError("User doesn't have access to the specified stream", {
      info: { userId, streamId }
    })
  }

  // Favorite/unfavorite the stream
  await setStreamFavorited({ streamId, userId, favorited })

  // Get updated stream info
  return await getStream({ streamId, userId })
}

/**
 * Get user favorited streams & metadata
 * @param {Object} p
 * @param {string} p.userId
 * @param {number} [p.limit] Defaults to 25
 * @param {string} [p.cursor] Optionally specify date after which to look for favorites
 * @returns
 */
export async function getFavoriteStreamsCollection({
  userId,
  limit,
  cursor
}: {
  userId: string
  limit?: number
  cursor?: string
}) {
  limit = _.clamp(limit || 25, 1, 25)

  // Get total count of favorited streams
  const totalCount = await getFavoritedStreamsCount(userId)

  // Get paginated streams
  const { cursor: finalCursor, streams } = await getFavoritedStreams({
    userId,
    cursor,
    limit
  })

  return { totalCount, cursor: finalCursor, items: streams }
}

/**
 * Get active user stream favorite date (using dataloader)
 * @param {Object} p
 * @param {import('@/modules/shared/index').GraphQLContext} p.ctx
 * @param {string} p.streamId
 * @param {Promise<string| null>}
 */
export async function getActiveUserStreamFavoriteDate({
  ctx,
  streamId
}: {
  ctx: AuthContext & {
    loaders: {
      streams: {
        getUserFavoriteData: {
          load: (streamId: string) => Promise<{ createdAt: Date }>
        }
      }
    }
  }
  streamId: string
}) {
  if (!ctx.userId) {
    return null
  }

  if (!streamId) {
    throw new InvalidArgumentError('Invalid stream ID')
  }

  return (
    (await ctx.loaders.streams.getUserFavoriteData.load(streamId))?.createdAt || null
  )
}

/**
 * Get stream favorites count (using dataloader)
 * @param {Object} p
 * @param {import('@/modules/shared/index').GraphQLContext} p.ctx
 * @param {string} p.streamId
 * @returns {Promise<number>}
 */
export async function getStreamFavoritesCount({
  ctx,
  streamId
}: {
  ctx: AuthContext & {
    loaders: {
      streams: { getFavoritesCount: { load: (streamId: string) => Promise<number> } }
    }
  }
  streamId: string
}) {
  if (!streamId) {
    throw new InvalidArgumentError('Invalid stream ID')
  }

  return (await ctx.loaders.streams.getFavoritesCount.load(streamId)) || 0
}

/**
 * @param {Object} p
 * @param {import('@/modules/shared/index').GraphQLContext} p.ctx
 * @param {string} p.userId
 * @returns {Promise<number>}
 */
export async function getOwnedFavoritesCount({
  ctx,
  userId
}: {
  ctx: AuthContext & {
    loaders: {
      streams: {
        getOwnedFavoritesCount: { load: (userId: string) => Promise<number> }
      }
    }
  }
  userId: string
}) {
  if (!userId) {
    throw new InvalidArgumentError('Invalid user ID')
  }

  return (await ctx.loaders.streams.getOwnedFavoritesCount.load(userId)) || 0
}
