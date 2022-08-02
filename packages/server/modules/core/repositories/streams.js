const _ = require('lodash')
const {
  Streams,
  StreamAcl,
  StreamFavorites,
  knex,
  Users
} = require('@/modules/core/dbSchema')
const { InvalidArgumentError } = require('@/modules/shared/errors')
const { Roles } = require('@/modules/core/helpers/mainConstants')

/**
 * List of base columns to select when querying for user streams
 * (expects join to StreamAcl)
 */
const BASE_STREAM_COLUMNS = [
  Streams.col.id,
  Streams.col.name,
  Streams.col.description,
  Streams.col.isPublic,
  Streams.col.createdAt,
  Streams.col.updatedAt,
  StreamAcl.col.role
]

/**
 * Get multiple streams
 * @param {string[]} streamIds
 * @returns {Promise<Object[]>}
 */
async function getStreams(streamIds) {
  if (!streamIds?.length) throw new InvalidArgumentError('Invalid stream IDs')
  const q = Streams.knex().whereIn(Streams.col.id, streamIds)
  return await q
}

/**
 * Get a single stream
 * @param {Object} p
 * @param {string} p.streamId
 * @param {string} [p.userId] Optionally resolve role for user
 * @returns {Promise<Object>}
 */
async function getStream({ streamId, userId }) {
  if (!streamId) throw new InvalidArgumentError('Invalid stream ID')

  const stream = await Streams.knex().where({ id: streamId }).select('*').first()
  if (!userId) return stream

  const acl = await StreamAcl.knex()
    .where({ resourceId: streamId, userId })
    .select('role')
    .first()
  if (acl) stream.role = acl.role
  return stream
}

/**
 * Get base query for finding or counting user favorited streams
 * @param {string} userId The user's ID
 */
function getFavoritedStreamsQueryBase(userId) {
  if (!userId)
    throw new InvalidArgumentError(
      'User ID must be specified to retrieve favorited streams'
    )

  const query = StreamFavorites.knex()
    .where(StreamFavorites.col.userId, userId)
    .innerJoin(Streams.name, Streams.col.id, StreamFavorites.col.streamId)
    .leftJoin(StreamAcl.name, (q) =>
      q
        .on(StreamAcl.col.resourceId, '=', StreamFavorites.col.streamId)
        .andOnVal(StreamAcl.col.userId, userId)
    )
    .andWhere((q) =>
      q.where(Streams.col.isPublic, true).orWhereNotNull(StreamAcl.col.resourceId)
    )

  return query
}

/**
 * Get favorited streams
 * @param {Object} p
 * @param {string} p.userId
 * @param {string} [p.cursor] ISO8601 timestamp after which to look for favoirtes
 * @param {number} [p.limit] Defaults to 25
 * @returns {Promise<{streams: Array, cursor: string | null}>}
 */
async function getFavoritedStreams({ userId, cursor, limit }) {
  const finalLimit = _.clamp(limit || 25, 1, 25)
  const query = getFavoritedStreamsQueryBase(userId)
  query
    .select()
    .columns([
      ...BASE_STREAM_COLUMNS,
      { favoritedDate: StreamFavorites.col.createdAt },
      { favCursor: StreamFavorites.col.cursor }
    ])
    .limit(finalLimit)
    .orderBy(StreamFavorites.col.cursor, 'desc')

  if (cursor) query.andWhere(StreamFavorites.col.cursor, '<', cursor)

  const rows = await query
  return {
    streams: rows,
    cursor: rows.length > 0 ? rows[rows.length - 1].favCursor : null
  }
}

/**
 * Get total amount of streams favorited by user
 * @param {string} userId
 * @returns {Promise<number>}
 */
async function getFavoritedStreamsCount(userId) {
  const query = getFavoritedStreamsQueryBase(userId)
  query.count()

  const [res] = await query
  return parseInt(res.count)
}

/**
 * Set stream as favorited/unfavorited for a specific user
 * @param {Object} p
 * @param {string} p.streamId
 * @param {string} p.userId
 * @param {boolean} [p.favorited] By default favorites the stream, but you can set this
 * to false to unfavorite it
 * @returns {Promise}
 */
async function setStreamFavorited({ streamId, userId, favorited = true }) {
  if (!userId || !streamId)
    throw new InvalidArgumentError('Invalid stream or user ID', {
      info: { userId, streamId }
    })

  const favoriteQuery = StreamFavorites.knex().where({
    streamId,
    userId
  })

  if (!favorited) {
    await favoriteQuery.del()
    return
  }

  // Upserting the favorite
  await StreamFavorites.knex()
    .insert({
      userId,
      streamId
    })
    .onConflict(['streamId', 'userId'])
    .ignore()

  return
}

/**
 * Get favorite metadata for specified user and all specified stream IDs
 * @param {Object} p
 * @param {string} p.userId
 * @param {string[]} p.streamIds
 * @returns {Promise<Object<string, Object>>} Favorite metadata keyed by stream ID
 */
async function getBatchUserFavoriteData({ userId, streamIds }) {
  if (!userId || !streamIds || !streamIds.length)
    throw new InvalidArgumentError('Invalid user ID or stream IDs', {
      info: { userId, streamIds }
    })

  const query = StreamFavorites.knex()
    .select()
    .where(StreamFavorites.col.userId, userId)
    .whereIn(StreamFavorites.col.streamId, streamIds)

  const rows = await query
  return _.keyBy(rows, 'streamId')
}

/**
 * Get favorites counts for all specified streams
 * @param {string[]} streamIds
 * @returns {Promise<Object<string, number>>} Favorite counts keyed by stream ids
 */
async function getBatchStreamFavoritesCounts(streamIds) {
  const query = StreamFavorites.knex()
    .select()
    .columns([StreamFavorites.col.streamId, knex.raw('COUNT(*) as count')])
    .whereIn(StreamFavorites.col.streamId, streamIds)
    .groupBy(StreamFavorites.col.streamId)

  const rows = await query
  return _.mapValues(_.keyBy(rows, 'streamId'), (r) => r?.count || 0)
}

/**
 * Check if user can favorite a stream
 * @param {Object} p
 * @param {string} userId
 * @param {string} streamId
 * @returns {Promise<boolean>}
 */
async function canUserFavoriteStream({ userId, streamId }) {
  if (!userId || !streamId)
    throw new InvalidArgumentError('Invalid stream or user ID', {
      info: { userId, streamId }
    })

  const query = Streams.knex()
    .select([Streams.col.id])
    .leftJoin(StreamAcl.name, function () {
      this.on(StreamAcl.col.resourceId, Streams.col.id).andOnVal(
        StreamAcl.col.userId,
        userId
      )
    })
    .where(Streams.col.id, streamId)
    .andWhere(function () {
      this.where(Streams.col.isPublic, true).orWhereNotNull(StreamAcl.col.resourceId)
    })
    .limit(1)

  const result = await query
  return result?.length > 0
}

/**
 * Find total favorites of owned streams for specified users
 * @param {string[]} userIds
 * @returns {Promise<Record<string, number>>}
 */
async function getOwnedFavoritesCountByUserIds(userIds) {
  const query = StreamAcl.knex()
    .select([StreamAcl.col.userId, knex.raw('COUNT(*)')])
    .join(StreamFavorites.name, function () {
      this.andOn(StreamFavorites.col.streamId, StreamAcl.col.resourceId)
    })
    .whereIn(StreamAcl.col.userId, userIds)
    .andWhere(StreamAcl.col.role, Roles.Stream.Owner)
    .groupBy(StreamAcl.col.userId)

  const results = await query
  return _.mapValues(_.keyBy(results, 'userId'), (r) => r?.count || 0)
}

/**
 * Get user & role, only if they are a stream collaborator
 * @param {string} streamId
 * @param {string} userId
 * @returns {Promise<import('@/modules/core/helpers/userHelper').LimitedUserRecord & {role: string} | null>}
 */
async function getStreamCollaborator(streamId, userId) {
  const query = StreamAcl.knex()
    .select(
      StreamAcl.col.role,
      Users.col.id,
      Users.col.name,
      Users.col.bio,
      Users.col.company,
      Users.col.avatar,
      Users.col.verified,
      Users.col.createdAt
    )
    .where({ [StreamAcl.col.resourceId]: streamId, [Users.col.id]: userId })
    .rightJoin(Users.name, Users.col.id, StreamAcl.col.userId)
    .first()

  return await query
}

module.exports = {
  getStream,
  getFavoritedStreams,
  getFavoritedStreamsCount,
  setStreamFavorited,
  canUserFavoriteStream,
  getBatchUserFavoriteData,
  getBatchStreamFavoritesCounts,
  getOwnedFavoritesCountByUserIds,
  getStreamCollaborator,
  getStreams,
  BASE_STREAM_COLUMNS
}
