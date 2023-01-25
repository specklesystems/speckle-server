'use strict'
const _ = require('lodash')
const { Streams, StreamAcl, knex } = require('@/modules/core/dbSchema')
const {
  getStream,
  getFavoritedStreams,
  getFavoritedStreamsCount,
  setStreamFavorited,
  canUserFavoriteStream,
  deleteStream: deleteStreamFromDb,
  updateStream: updateStreamInDb
} = require('@/modules/core/repositories/streams')
const { UnauthorizedError, InvalidArgumentError } = require('@/modules/shared/errors')
const { StreamAccessUpdateError } = require('@/modules/core/errors/stream')
const { dbLogger } = require('@/logging/logging')
const {
  createStreamReturnRecord
} = require('@/modules/core/services/streams/management')

/**
 * NOTE: Stop adding stuff to this service, create specialized service modules instead for various domains
 * relating to streams. Otherwise we're not only breaking the single responsibility principle, but also
 * increasing the chances of circular dependencies (which often cause actual errors) since everything relies
 * on this service.
 */

module.exports = {
  /**
   * @deprecated Use createStreamReturnRecord()
   * @param {import('@/modules/core/graph/generated/graphql').StreamCreateInput & {ownerId: string}} param0
   * @returns {Promise<string>}
   */
  async createStream(params) {
    const { id } = await createStreamReturnRecord(params, {
      createActivity: false
    })
    return id
  },

  getStream,

  /**
   * @deprecated Use updateStreamAndNotify or use the repository function directly
   * @param {import('@/modules/core/graph/generated/graphql').StreamUpdateInput} update
   */
  async updateStream(update) {
    const updatedStream = await updateStreamInDb(update)
    return updatedStream?.id || null
  },

  setStreamFavorited,

  async grantPermissionsStream({ streamId, userId, role }) {
    // upserts the existing role (sets a new one!)
    // TODO: check if we're removing the last owner (ie, does the stream still have an owner after this operation)?
    const query =
      StreamAcl.knex().insert({ userId, resourceId: streamId, role }).toString() +
      ' on conflict on constraint stream_acl_pkey do update set role=excluded.role'

    await knex.raw(query)

    // update stream updated at
    const [stream] = await Streams.knex()
      .where({ id: streamId })
      .update({ updatedAt: knex.fn.now() }, '*')
    return stream
  },

  async revokePermissionsStream({ streamId, userId }) {
    const [streamAclEntriesCount] = await StreamAcl.knex()
      // let [streamAclEntriesCount] = await StreamAcl.knex()
      .where({ resourceId: streamId })
      .count()
    // TODO: check if streamAclEntriesCount === 1 then throw big boo-boo (can't delete last ownership link)

    if (parseInt(streamAclEntriesCount.count) === 1)
      throw new StreamAccessUpdateError(
        'Stream has only one ownership link left - cannot revoke permissions.',
        { info: { streamId, userId } }
      )

    // TODO: below behaviour not correct. Flow:
    // Count owners
    // If owner count > 1, then proceed to delete, otherwise throw an error (can't delete last owner - delete stream)

    const aclEntry = await StreamAcl.knex()
      .where({ resourceId: streamId, userId })
      .select('*')
      .first()

    if (aclEntry.role === 'stream:owner') {
      const ownersCount = StreamAcl.knex().count({
        resourceId: streamId,
        role: 'stream:owner'
      })
      if (ownersCount === 1)
        throw new StreamAccessUpdateError(
          'Could not revoke permissions for last admin',
          {
            info: { streamId, userId }
          }
        )
      else {
        await StreamAcl.knex().where({ resourceId: streamId, userId }).del()
        return true
      }
    }

    const delCount = await StreamAcl.knex()
      .where({ resourceId: streamId, userId })
      .del()

    if (delCount === 0)
      throw new StreamAccessUpdateError('Could not revoke permissions for user', {
        info: { streamId, userId }
      })

    // update stream updated at
    await Streams.knex().where({ id: streamId }).update({ updatedAt: knex.fn.now() })

    return true
  },

  /**
   * @deprecated Use deleteStreamAndNotify or use the repository function directly
   */
  async deleteStream({ streamId }) {
    dbLogger.info('Deleting stream %s', streamId)
    return await deleteStreamFromDb(streamId)
  },

  async getStreams({ offset, limit, orderBy, visibility, searchQuery }) {
    const query = knex
      .column(
        'streams.*',
        knex.raw('coalesce(sum(pg_column_size(objects.data)),0) as size')
      )
      .select()
      .from('streams')
      .leftJoin('objects', 'streams.id', 'objects.streamId')
      .groupBy('streams.id')

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
    const [res] = await countQuery.count()
    const count = parseInt(res.count)

    if (!count) return { streams: [], totalCount: 0 }

    orderBy = orderBy || 'updatedAt,desc'

    const [columnName, order] = orderBy.split(',')

    const rows = await query.orderBy(`${columnName}`, order).offset(offset).limit(limit)

    return { streams: rows, totalCount: count }
  },

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
   * @returns {Promise<Object>} Updated stream
   */
  async favoriteStream({ userId, streamId, favorited }) {
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
  },

  /**
   * Get user favorited streams & metadata
   * @param {Object} p
   * @param {string} p.userId
   * @param {number} [p.limit] Defaults to 25
   * @param {string} [p.cursor] Optionally specify date after which to look for favorites
   * @returns
   */
  async getFavoriteStreamsCollection({ userId, limit, cursor }) {
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
  },

  /**
   * Get active user stream favorite date (using dataloader)
   * @param {Object} p
   * @param {import('@/modules/shared/index').GraphQLContext} p.ctx
   * @param {string} p.streamId
   * @param {Promise<string| null>}
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
