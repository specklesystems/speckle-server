const { StreamAcl, knex } = require('@/modules/core/dbSchema')
const {
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
