import _, { isNaN, toNumber } from 'lodash'
import {
  Streams,
  StreamAcl,
  StreamFavorites,
  knex,
  Users
} from '@/modules/core/dbSchema'
import { InvalidArgumentError } from '@/modules/shared/errors'
import { Roles, StreamRoles } from '@/modules/core/helpers/mainConstants'
import {
  LimitedUserRecord,
  StreamAclRecord,
  StreamFavoriteRecord,
  StreamRecord
} from '@/modules/core/helpers/types'
import {
  DiscoverableStreamsSortingInput,
  DiscoverableStreamsSortType,
  QueryDiscoverableStreamsArgs,
  SortDirection
} from '@/modules/core/graph/generated/graphql'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { decodeCursor, encodeCursor } from '@/modules/shared/helpers/graphqlHelper'
import dayjs from 'dayjs'
import { UserWithOptionalRole } from '@/modules/core/repositories/users'

export type BasicStream = Pick<
  StreamRecord,
  | 'id'
  | 'name'
  | 'description'
  | 'isPublic'
  | 'isDiscoverable'
  | 'createdAt'
  | 'updatedAt'
> &
  Pick<StreamAclRecord, 'role'>

export type StreamWithOptionalRole = StreamRecord & {
  /**
   * Available, if query joined this data StreamAcl
   */
  role?: string
}

/**
 * List of base columns to select when querying for user streams
 * (expects join to StreamAcl)
 */
export const BASE_STREAM_COLUMNS = [
  Streams.col.id,
  Streams.col.name,
  Streams.col.description,
  Streams.col.isPublic,
  Streams.col.isDiscoverable,
  Streams.col.createdAt,
  Streams.col.updatedAt,
  StreamAcl.col.role
]

/**
 * Get multiple streams
 * @param {string[]} streamIds
 */
export async function getStreams(streamIds: string[]) {
  if (!streamIds?.length) throw new InvalidArgumentError('Invalid stream IDs')
  const q = Streams.knex<StreamRecord[]>().whereIn(Streams.col.id, streamIds)
  return await q
}

/**
 * Get a single stream. If userId is specified, the role will be resolved as well.
 */
export async function getStream(params: { streamId: string; userId?: string }) {
  const { streamId, userId } = params
  if (!streamId) throw new InvalidArgumentError('Invalid stream ID')

  const q = Streams.knex<StreamWithOptionalRole[]>().where({
    [Streams.col.id]: streamId
  })

  if (userId) {
    q.select([
      ...Object.values(Streams.col),
      // Getting first role from grouped results
      knex.raw(`(array_agg("stream_acl"."role"))[1] as role`)
    ])
    q.leftJoin(StreamAcl.name, function () {
      this.on(StreamAcl.col.resourceId, Streams.col.id).andOnVal(
        StreamAcl.col.userId,
        userId
      )
    })
    q.groupBy(Streams.col.id) //
  }

  const res = await q.first()
  return res
}

/**
 * Get base query for finding or counting user favorited streams
 * @param {string} userId The user's ID
 */
function getFavoritedStreamsQueryBase<
  Result = Array<StreamFavoriteRecord & StreamRecord & StreamAclRecord>
>(userId: string) {
  if (!userId)
    throw new InvalidArgumentError(
      'User ID must be specified to retrieve favorited streams'
    )

  const query = StreamFavorites.knex<Result>()
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
 */
export async function getFavoritedStreams(params: {
  userId: string
  cursor?: string
  limit?: number
}) {
  const { userId, cursor, limit } = params
  const finalLimit = _.clamp(limit || 25, 1, 25)
  const query =
    getFavoritedStreamsQueryBase<
      Array<BasicStream & { favoritedDate: Date; favCursor: string }>
    >(userId)
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
 */
export async function getFavoritedStreamsCount(userId: string) {
  const query = getFavoritedStreamsQueryBase<[{ count: string }]>(userId)
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
 */
export async function setStreamFavorited(params: {
  streamId: string
  userId: string
  favorited?: boolean
}) {
  const { streamId, userId, favorited = true } = params

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
 * @returns Favorite metadata keyed by stream ID
 */
export async function getBatchUserFavoriteData(params: {
  userId: string
  streamIds: string[]
}) {
  const { userId, streamIds } = params
  if (!userId || !streamIds || !streamIds.length)
    throw new InvalidArgumentError('Invalid user ID or stream IDs', {
      info: { userId, streamIds }
    })

  const query = StreamFavorites.knex<StreamFavoriteRecord[]>()
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
export async function getBatchStreamFavoritesCounts(streamIds: string[]) {
  const query = StreamFavorites.knex()
    .columns<{ streamId: string; count: string }[]>([
      StreamFavorites.col.streamId,
      knex.raw('COUNT(*) as count')
    ])
    .whereIn(StreamFavorites.col.streamId, streamIds)
    .groupBy(StreamFavorites.col.streamId)

  const rows = await query
  return _.mapValues(_.keyBy(rows, 'streamId'), (r) => parseInt(r?.count || '0'))
}

/**
 * Check if user can favorite a stream
 * @param {Object} p
 * @param {string} userId
 * @param {string} streamId
 * @returns {Promise<boolean>}
 */
export async function canUserFavoriteStream(params: {
  userId: string
  streamId: string
}) {
  const { userId, streamId } = params

  if (!userId || !streamId)
    throw new InvalidArgumentError('Invalid stream or user ID', {
      info: { userId, streamId }
    })

  const query = Streams.knex()
    .select<Array<Pick<StreamRecord, 'id'>>>([Streams.col.id])
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
export async function getOwnedFavoritesCountByUserIds(userIds: string[]) {
  const query = StreamAcl.knex()
    .select<Array<{ userId: string; count: string }>>([
      StreamAcl.col.userId,
      knex.raw('COUNT(*)')
    ])
    .join(StreamFavorites.name, function () {
      this.andOn(StreamFavorites.col.streamId, StreamAcl.col.resourceId)
    })
    .whereIn(StreamAcl.col.userId, userIds)
    .andWhere(StreamAcl.col.role, Roles.Stream.Owner)
    .groupBy(StreamAcl.col.userId)

  const results = await query
  return _.mapValues(_.keyBy(results, 'userId'), (r) => parseInt(r?.count || '0'))
}

/**
 * Get user & role, only if they are a stream collaborator
 */
export async function getStreamCollaborator(streamId: string, userId: string) {
  const query = StreamAcl.knex()
    .select<Array<LimitedUserRecord & { role: string }>>(
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

  const res = await query
  return res
}

/**
 * Get user's role in all of the specified streams
 */
export async function getStreamRoles(userId: string, streamIds: string[]) {
  const q = Streams.knex()
    .select<{ id: string; role: Nullable<string> }[]>([
      Streams.col.id,
      StreamAcl.col.role
    ])
    .leftJoin(StreamAcl.name, (q) =>
      q
        .on(StreamAcl.col.resourceId, '=', Streams.col.id)
        .andOnVal(StreamAcl.col.userId, userId)
    )
    .whereIn(Streams.col.id, streamIds)

  const results = await q
  return _.mapValues(
    _.keyBy(results, (r) => r.id),
    (v) => v.role
  )
}

export type GetDiscoverableStreamsParams = Required<QueryDiscoverableStreamsArgs> & {
  sort: DiscoverableStreamsSortingInput
}

function buildDiscoverableStreamsBaseQuery<Result = Array<StreamRecord>>() {
  const q = Streams.knex()
    .select<Result>(Streams.cols)
    .where(Streams.col.isDiscoverable, true)
    .andWhere(Streams.col.isPublic, true)

  return q
}

const decodeDiscoverableStreamsCursor = (
  sortType: DiscoverableStreamsSortType,
  cursor: string
): Nullable<string | number> => {
  const decodedCursor = cursor ? decodeCursor(cursor) : null

  switch (sortType) {
    case DiscoverableStreamsSortType.CreatedDate: {
      let dateCursor: Nullable<string> = null
      try {
        dateCursor = dayjs(decodedCursor).toISOString()
      } catch (e: unknown) {
        if (!(e instanceof RangeError)) {
          throw e
        }
      }

      return dateCursor
    }
    case DiscoverableStreamsSortType.FavoritesCount: {
      const numericCursor = toNumber(decodedCursor)
      return isNaN(numericCursor) ? null : numericCursor
    }
  }
}

export const encodeDiscoverableStreamsCursor = (
  sortType: DiscoverableStreamsSortType,
  retrievedStreams: StreamRecord[],
  previousCursor: Nullable<string>
): Nullable<string> => {
  const decodedPreviousCursor = previousCursor
    ? decodeDiscoverableStreamsCursor(sortType, previousCursor)
    : null

  let value: Nullable<string>
  switch (sortType) {
    case DiscoverableStreamsSortType.CreatedDate: {
      // Using timestamps for filtering w/ a WHERE clause,
      // cause there will never be duplicates
      const lastItem = retrievedStreams.length
        ? retrievedStreams[retrievedStreams.length - 1]
        : null
      value = lastItem?.createdAt.toISOString() || null
      break
    }
    case DiscoverableStreamsSortType.FavoritesCount: {
      // Using offset based pagination here, cause there will be many rows with
      // the same favorite count
      const previousOffset: number = (decodedPreviousCursor as number) || 0
      value = `${previousOffset + retrievedStreams.length}`
      break
    }
  }

  return value ? encodeCursor(value) : null
}

/**
 * Counts all discoverable streams
 */
export async function countDiscoverableStreams() {
  const q = buildDiscoverableStreamsBaseQuery<{ count: string }[]>()
  q.clearSelect()
  q.count()

  const [res] = await q
  return parseInt(res.count)
}

/**
 * Paginated discoverable stream retrieval with support for multiple sorting approaches
 */
export async function getDiscoverableStreams(params: GetDiscoverableStreamsParams) {
  const { cursor, sort, limit } = params
  const q = buildDiscoverableStreamsBaseQuery().limit(limit)

  const decodedCursor = cursor
    ? decodeDiscoverableStreamsCursor(sort.type, cursor)
    : null
  const sortOperator = sort.direction === SortDirection.Asc ? '>' : '<'

  switch (sort.type) {
    case DiscoverableStreamsSortType.CreatedDate: {
      q.orderBy([
        { column: Streams.col.createdAt, order: sort.direction },
        { column: Streams.col.name }
      ])

      if (decodedCursor) {
        q.andWhere(Streams.col.createdAt, sortOperator, decodedCursor)
      }

      break
    }
    case DiscoverableStreamsSortType.FavoritesCount: {
      q.leftJoin(StreamFavorites.name, StreamFavorites.col.streamId, Streams.col.id)
        .groupBy(Streams.col.id)
        .orderByRaw(`COUNT("stream_favorites"."streamId") ${sort.direction}`)
        .orderBy([{ column: Streams.col.name }])

      if (decodedCursor) q.offset(decodedCursor as number)
      break
    }
  }

  return await q
}

/**
 * Get all stream collaborators. Optionally filter only specific roles.
 */
export async function getStreamCollaborators(streamId: string, type?: StreamRoles) {
  const q = StreamAcl.knex()
    .select<UserWithOptionalRole[]>([...Users.cols, StreamAcl.col.role])
    .where(StreamAcl.col.resourceId, streamId)
    .innerJoin(Users.name, Users.col.id, StreamAcl.col.userId)

  if (type) {
    q.andWhere(StreamAcl.col.role, type)
  }

  return await q
}
