'use strict'
const _ = require('lodash')
const { Streams, StreamAcl, knex } = require('@/modules/core/dbSchema')
const {
  getFavoritedStreams,
  getFavoritedStreamsCount,
  setStreamFavorited,
  canUserFavoriteStream,
  getStreamFactory
} = require('@/modules/core/repositories/streams')
const { UnauthorizedError, InvalidArgumentError } = require('@/modules/shared/errors')
const { isResourceAllowed } = require('@/modules/core/helpers/token')
const {
  TokenResourceIdentifierType
} = require('@/modules/core/graph/generated/graphql')

/**
 * NOTE: Stop adding stuff to this service, create specialized service modules instead for various domains
 * relating to streams. Otherwise we're not only breaking the single responsibility principle, but also
 * increasing the chances of circular dependencies (which often cause actual errors) since everything relies
 * on this service.
 */

module.exports = {
  setStreamFavorited,

  /**
   * @param {Object} p
   * @param {string | Date | null} [p.cursor]
   * @param {number} p.limit
   * @param {string | null} [p.orderBy]
   * @param {string | null} [p.visibility]
   * @param {string | null} [p.searchQuery]
   * @param {string[] | null} [p.streamIdWhitelist]
   * @param {string[] | null} [p.workspaceIdWhitelist]
   * @param {number | null} [p.offset]
   * @param {boolean | null} [p.publicOnly]
   * @deprecated Use getStreams() from the repository directly
   */
  async getStreams({
    cursor,
    limit,
    orderBy,
    visibility,
    searchQuery,
    streamIdWhitelist,
    workspaceIdWhitelist,
    offset,
    publicOnly
  }) {
    const query = knex.select().from('streams')

    const countQuery = Streams.knex()

    if (searchQuery) {
      const whereFunc = function () {
        this.where('streams.name', 'ILIKE', `%${searchQuery}%`).orWhere(
          'streams.description',
          'ILIKE',
          `%${searchQuery}%`
        )
      }
      query.where(whereFunc)
      countQuery.where(whereFunc)
    }

    if (publicOnly) {
      visibility = 'public'
    }

    if (visibility && visibility !== 'all') {
      if (!['private', 'public'].includes(visibility))
        throw new Error('Stream visibility should be either private, public or all')
      const isPublic = visibility === 'public'
      const publicFunc = function () {
        this.where({ isPublic })
      }
      query.andWhere(publicFunc)
      countQuery.andWhere(publicFunc)
    }

    if (streamIdWhitelist?.length) {
      query.whereIn('id', streamIdWhitelist)
      countQuery.whereIn('id', streamIdWhitelist)
    }

    if (workspaceIdWhitelist?.length) {
      query.whereIn('workspaceId', workspaceIdWhitelist)
      countQuery.whereIn('workspaceId', workspaceIdWhitelist)
    }

    const [res] = await countQuery.count()
    const count = parseInt(res.count)

    if (!count) return { streams: [], totalCount: 0 }

    orderBy = orderBy || 'updatedAt,desc'

    const [columnName, order] = orderBy.split(',')

    if (cursor) query.where(columnName, order === 'desc' ? '<' : '>', cursor)

    query.orderBy(`${columnName}`, order).limit(limit)
    if (offset) {
      query.offset(offset)
    }

    const rows = await query

    const cursorDate = rows.length ? rows.slice(-1)[0][columnName] : null
    return { streams: rows, totalCount: count, cursorDate }
  },

  /**
   * @returns {Promise<{role: string, id: string, name: string, company: string, avatar: string}[]>}
   */
  async getStreamUsers({ streamId }) {
    const query = StreamAcl.knex()
      .columns({ role: 'stream_acl.role' }, 'id', 'name', 'company', 'avatar')
      .select()
      .where({ resourceId: streamId })
      .rightJoin('users', { 'users.id': 'stream_acl.userId' })
      .select('stream_acl.role', 'name', 'id', 'company', 'avatar')
      .orderBy('stream_acl.role')

    return await query
  },

  /**
   * Favorite or unfavorite a stream
   * @param {Object} p
   * @param {string} p.userId
   * @param {string} p.streamId
   * @param {boolean} [p.favorited] Whether to favorite or unfavorite (true by default)
   * @param {import('@/modules/core/helpers/token').ContextResourceAccessRules} [p.userResourceAccessRules] Resource access rules (if any) for the user doing the favoriting
   * @returns {Promise<import('@/modules/core/helpers/types').StreamRecord>} Updated stream
   */
  async favoriteStream({ userId, streamId, favorited, userResourceAccessRules }) {
    // Check if user has access to stream
    const canFavorite = await canUserFavoriteStream({ userId, streamId })
    const hasResourceAccess = isResourceAllowed({
      resourceId: streamId,
      resourceAccessRules: userResourceAccessRules,
      resourceType: TokenResourceIdentifierType.Project
    })
    if (!canFavorite || !hasResourceAccess) {
      throw new UnauthorizedError("User doesn't have access to the specified stream", {
        info: { userId, streamId }
      })
    }

    // Favorite/unfavorite the stream
    await setStreamFavorited({ streamId, userId, favorited })

    const getStream = getStreamFactory({ db: knex })

    // Get updated stream info
    return await getStream({ streamId, userId })
  },

  /**
   * Get user favorited streams & metadata
   * @param {Object} p
   * @param {string} p.userId
   * @param {number} [p.limit] Defaults to 25
   * @param {string|null} [p.cursor] Optionally specify date after which to look for favorites
   * @param {string[] | undefined} [p.streamIdWhitelist] Optionally specify a list of stream IDs to filter by
   * @returns
   */
  async getFavoriteStreamsCollection({ userId, limit, cursor, streamIdWhitelist }) {
    limit = _.clamp(limit || 25, 1, 25)

    // Get total count of favorited streams
    const totalCount = await getFavoritedStreamsCount(userId, streamIdWhitelist)

    // Get paginated streams
    const { cursor: finalCursor, streams } = await getFavoritedStreams({
      userId,
      cursor,
      limit,
      streamIdWhitelist
    })

    return { totalCount, cursor: finalCursor, items: streams }
  },

  /**
   * Get active user stream favorite date (using dataloader)
   * @param {Object} p
   * @param {import('@/modules/shared/index').GraphQLContext} p.ctx
   * @param {string} p.streamId
   * @returns {Promise<string | null>}
   */
  async getActiveUserStreamFavoriteDate({ ctx, streamId }) {
    if (!ctx.userId) {
      return null
    }

    if (!streamId) {
      throw new InvalidArgumentError('Invalid stream ID')
    }

    return (
      (await ctx.loaders.streams.getUserFavoriteData.load(streamId))?.createdAt || null
    )
  },

  /**
   * Get stream favorites count (using dataloader)
   * @param {Object} p
   * @param {import('@/modules/shared/index').GraphQLContext} p.ctx
   * @param {string} p.streamId
   * @returns {Promise<number>}
   */
  async getStreamFavoritesCount({ ctx, streamId }) {
    if (!streamId) {
      throw new InvalidArgumentError('Invalid stream ID')
    }

    return (await ctx.loaders.streams.getFavoritesCount.load(streamId)) || 0
  },

  /**
   * @param {Object} p
   * @param {import('@/modules/shared/index').GraphQLContext} p.ctx
   * @param {string} p.userId
   * @returns {Promise<number>}
   */
  async getOwnedFavoritesCount({ ctx, userId }) {
    if (!userId) {
      throw new InvalidArgumentError('Invalid user ID')
    }

    return (await ctx.loaders.streams.getOwnedFavoritesCount.load(userId)) || 0
  }
}
