const _ = require('lodash')
const { Streams, StreamAcl, StreamFavorites, knex } = require('@/modules/core/dbSchema')
const { InvalidArgumentError } = require('@/modules/core/errors/base')

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
 * Get a single stream
 * @param {Object} p
 * @param {string} p.streamId
 * @param {string} [p.userId] Optionally resolve role for user
 * @returns {Promise<Object>}
 */
async function getStream({ streamId, userId }) {
  if (!streamId) throw new InvalidArgumentError('Invalid stream ID')

  let stream = await Streams.knex().where({ id: streamId }).select('*').first()
  if (!userId) return stream

  let acl = await StreamAcl.knex()
    .where({ resourceId: streamId, userId: userId })
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
    throw new InvalidArgumentError('User ID must be specified to retrieve favorited streams')

  const query = StreamFavorites.knex()
    .where(StreamFavorites.col.userId, userId)
    .innerJoin(Streams.name, Streams.col.id, StreamFavorites.col.streamId)
    .leftJoin(StreamAcl.name, (q) =>
      q
        .on(StreamAcl.col.resourceId, '=', StreamFavorites.col.streamId)
        .andOnVal(StreamAcl.col.userId, userId)
    )
    .andWhere((q) => q.where(Streams.col.isPublic, true).orWhereNotNull(StreamAcl.col.resourceId))

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
    .columns([...BASE_STREAM_COLUMNS, { favoritedDate: StreamFavorites.col.createdAt }])
    .limit(finalLimit)
    .orderBy(StreamFavorites.col.createdAt, 'desc')

  if (cursor) query.andWhere(StreamFavorites.col.createdAt, '<', cursor)

  let rows = await query
  return {
    streams: rows,
    cursor: rows.length > 0 ? rows[rows.length - 1].favoritedDate.toISOString() : null
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

  let [res] = await query
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
      this.on(StreamAcl.col.resourceId, Streams.col.id).andOnVal(StreamAcl.col.userId, userId)
    })
    .where(Streams.col.id, streamId)
    .andWhere(function () {
      this.where(Streams.col.isPublic, true).orWhereNotNull(StreamAcl.col.resourceId)
    })
    .limit(1)

  const result = await query
  return result?.length > 0
}

module.exports = {
  getStream,
  getFavoritedStreams,
  getFavoritedStreamsCount,
  setStreamFavorited,
  canUserFavoriteStream,
  getBatchUserFavoriteData,
  getBatchStreamFavoritesCounts,
  BASE_STREAM_COLUMNS
}
