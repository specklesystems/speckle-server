'use strict'
const crs = require('crypto-random-string')
const debug = require('debug')

const { createBranch } = require('@/modules/core/services/branches')
const { Streams, StreamAcl, knex, StreamFavorites } = require('@/modules/core/dbSchema')

/**
 * List of columns to select when querying for user streams
 * (expects joins to StreamAcl & StreamFavorites)
 */
const userStreamColumns = [
  Streams.col.id,
  Streams.col.name,
  Streams.col.description,
  Streams.col.isPublic,
  Streams.col.createdAt,
  Streams.col.updatedAt,
  StreamAcl.col.role,
  { favoritedDate: StreamFavorites.col.createdAt }
]

/**
 * Get base query for finding or counting user streams
 * @param {object} p
 * @param {string} [p.searchQuery] Filter by name/description/id
 * @param {boolean} [p.publicOnly] Whether to only look for public streams
 * @param {string} p.userId The user's ID
 */
function getUserStreamsQueryBase({ userId, publicOnly, searchQuery }) {
  const query = StreamAcl.knex()
    .where(StreamAcl.col.userId, userId)
    .join(Streams.name, StreamAcl.col.resourceId, Streams.col.id)

  if (publicOnly) query.andWhere(Streams.col.isPublic, true)

  if (searchQuery)
    query.andWhere(function () {
      this.where(Streams.col.name, 'ILIKE', `%${searchQuery}%`)
        .orWhere(Streams.col.description, 'ILIKE', `%${searchQuery}%`)
        .orWhere(Streams.col.id, 'ILIKE', `%${searchQuery}%`) //potentially useless?
    })

  return query
}

/**
 * Get base query for finding or counting user favorited streams
 * @param {string} userId The user's ID
 */
function getFavoritedStreamsQueryBase(userId) {
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

module.exports = {
  async createStream({ name, description, isPublic, ownerId }) {
    let stream = {
      id: crs({ length: 10 }),
      name: name || generateStreamName(),
      description: description || '',
      isPublic: isPublic !== false,
      updatedAt: knex.fn.now()
    }

    // Create the stream & set up permissions
    let [{ id: streamId }] = await Streams.knex().returning('id').insert(stream)
    await StreamAcl.knex().insert({ userId: ownerId, resourceId: streamId, role: 'stream:owner' })

    // Create a default main branch
    await createBranch({
      name: 'main',
      description: 'default branch',
      streamId: streamId,
      authorId: ownerId
    })
    return streamId
  },

  async getStream({ streamId, userId }) {
    let stream = await Streams.knex().where({ id: streamId }).select('*').first()
    if (!userId) return stream

    let acl = await StreamAcl.knex()
      .where({ resourceId: streamId, userId: userId })
      .select('role')
      .first()
    if (acl) stream.role = acl.role
    return stream
  },

  async updateStream({ streamId, name, description, isPublic }) {
    let [{ id }] = await Streams.knex()
      .returning('id')
      .where({ id: streamId })
      .update({ name, description, isPublic, updatedAt: knex.fn.now() })
    return id
  },

  async grantPermissionsStream({ streamId, userId, role }) {
    // upserts the existing role (sets a new one!)
    // TODO: check if we're removing the last owner (ie, does the stream still have an owner after this operation)?
    let query =
      StreamAcl.knex().insert({ userId: userId, resourceId: streamId, role: role }).toString() +
      ' on conflict on constraint stream_acl_pkey do update set role=excluded.role'

    await knex.raw(query)

    // update stream updated at
    await Streams.knex().where({ id: streamId }).update({ updatedAt: knex.fn.now() })
    return true
  },

  async revokePermissionsStream({ streamId, userId }) {
    let streamAclEntriesCount = StreamAcl.knex().count({ resourceId: streamId })
    // TODO: check if streamAclEntriesCount === 1 then throw big boo-boo (can't delete last ownership link)

    if (streamAclEntriesCount === 1)
      throw new Error('Stream has only one ownership link left - cannot revoke permissions.')

    // TODO: below behaviour not correct. Flow:
    // Count owners
    // If owner count > 1, then proceed to delete, otherwise throw an error (can't delete last owner - delete stream)

    let aclEntry = await StreamAcl.knex()
      .where({ resourceId: streamId, userId: userId })
      .select('*')
      .first()

    if (aclEntry.role === 'stream:owner') {
      let ownersCount = StreamAcl.knex().count({ resourceId: streamId, role: 'stream:owner' })
      if (ownersCount === 1) throw new Error('Could not revoke permissions for user')
      else {
        await StreamAcl.knex().where({ resourceId: streamId, userId: userId }).del()
        return true
      }
    }

    let delCount = await StreamAcl.knex().where({ resourceId: streamId, userId: userId }).del()

    if (delCount === 0) throw new Error('Could not revoke permissions for user')

    // update stream updated at
    await Streams.knex().where({ id: streamId }).update({ updatedAt: knex.fn.now() })

    return true
  },

  async deleteStream({ streamId }) {
    debug('speckle:db')('Deleting stream ' + streamId)

    // Delete stream commits (not automatically cascaded)
    await knex.raw(
      `
      DELETE FROM commits WHERE id IN (
        SELECT sc."commitId" FROM streams s
        INNER JOIN stream_commits sc ON s.id = sc."streamId"
        WHERE s.id = ?
      )
      `,
      [streamId]
    )
    return await Streams.knex().where({ id: streamId }).del()
  },

  /**
   * Get the streams the user has access to
   * @param {object} p
   * @param {string} p.searchQuery Filter by name/description/id
   * @param {boolean} p.publicOnly Whether to only look for public streams
   * @param {string} p.userId The user's ID
   * @param {number} p.limit Max amount of items to return
   * @param {string} p.cursor Timestamp after which to look for items
   * @returns {{streams: Array, cursor: string|null}}
   */
  async getUserStreams({ userId, limit, cursor, publicOnly, searchQuery }) {
    const finalLimit = limit || 25
    const isPublicOnly = publicOnly !== false //defaults to true if not provided

    const query = getUserStreamsQueryBase({ userId, publicOnly: isPublicOnly, searchQuery })
    query.columns(userStreamColumns).select()

    // Get favorites info
    query.leftJoin(StreamFavorites.name, function () {
      this.on(StreamFavorites.col.streamId, '=', Streams.col.id).andOn(
        StreamFavorites.col.userId,
        '=',
        StreamAcl.col.userId
      )
    })

    if (cursor) query.andWhere(Streams.col.updatedAt, '<', cursor)

    query.orderBy(Streams.col.updatedAt, 'desc').limit(finalLimit)

    let rows = await query
    return {
      streams: rows,
      cursor: rows.length > 0 ? rows[rows.length - 1].updatedAt.toISOString() : null
    }
  },

  async getStreams({ offset, limit, orderBy, visibility, searchQuery }) {
    let query = knex
      .column('streams.*', knex.raw('coalesce(sum(pg_column_size(objects.data)),0) as size'))
      .select()
      .from('streams')
      .leftJoin('objects', 'streams.id', 'objects.streamId')
      .groupBy('streams.id')

    let countQuery = Streams.knex()

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
      let isPublic = visibility === 'public'
      const publicFunc = function () {
        this.where({ isPublic })
      }
      query.andWhere(publicFunc)
      countQuery.andWhere(publicFunc)
    }
    let [res] = await countQuery.count()
    let count = parseInt(res.count)

    if (!count) return { streams: [], totalCount: 0 }

    orderBy = orderBy || 'updatedAt,desc'

    let [columnName, order] = orderBy.split(',')

    let rows = await query.orderBy(`${columnName}`, order).offset(offset).limit(limit)

    return { streams: rows, totalCount: count }
  },

  /**
   * Get the total amount of streams the user has access to
   * @param {object} p
   * @param {string} p.searchQuery Filter by name/description/id
   * @param {boolean} p.publicOnly Whether to only look for public streams
   * @param {string} p.userId The user's ID
   */
  async getUserStreamsCount({ userId, publicOnly, searchQuery }) {
    const isPublicOnly = publicOnly !== false //defaults to true if not provided

    const query = getUserStreamsQueryBase({ userId, publicOnly: isPublicOnly, searchQuery })
    query.count()

    let [res] = await query
    return parseInt(res.count)
  },

  async getStreamUsers({ streamId }) {
    let query = StreamAcl.knex()
      .columns({ role: 'stream_acl.role' }, 'id', 'name', 'company', 'avatar')
      .select()
      .where({ resourceId: streamId })
      .rightJoin('users', { 'users.id': 'stream_acl.userId' })
      .select('stream_acl.role', 'name', 'id', 'company', 'avatar')
      .orderBy('stream_acl.role')

    return await query
  },

  async getFavoritedStreams({ userId, cursor, limit }) {
    const finalLimit = limit || 25
    const query = getFavoritedStreamsQueryBase(userId)
    query
      .select()
      .columns(userStreamColumns)
      .limit(finalLimit)
      .orderBy(StreamFavorites.col.createdAt, 'desc')

    if (cursor) query.andWhere(StreamFavorites.col.createdAt, '<', cursor)

    let rows = await query
    return {
      streams: rows,
      cursor: rows.length > 0 ? rows[rows.length - 1].updatedAt.toISOString() : null
    }
  },

  async getFavoritedStreamsCount(userId) {
    const query = getFavoritedStreamsQueryBase(userId)
    query.count()

    let [res] = await query
    return parseInt(res.count)
  }
}

const adjectives = [
  'Tall',
  'Curved',
  'Stacked',
  'Purple',
  'Pink',
  'Rectangular',
  'Circular',
  'Oval',
  'Shiny',
  'Speckled',
  'Blue',
  'Stretched',
  'Round',
  'Spherical',
  'Majestic',
  'Symmetrical'
]

const nouns = [
  'Building',
  'House',
  'Treehouse',
  'Tower',
  'Tunnel',
  'Bridge',
  'Pyramid',
  'Structure',
  'Edifice',
  'Palace',
  'Castle',
  'Villa'
]

const generateStreamName = () => {
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${
    nouns[Math.floor(Math.random() * nouns.length)]
  }`
}
