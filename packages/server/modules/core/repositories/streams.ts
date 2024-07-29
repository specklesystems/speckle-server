import _, {
  clamp,
  has,
  isNaN,
  isNull,
  isUndefined,
  mapValues,
  omitBy,
  reduce,
  toNumber
} from 'lodash'
import {
  Streams,
  StreamAcl,
  StreamFavorites,
  knex,
  Users,
  StreamCommits,
  Commits,
  Branches,
  ServerAcl
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
  ProjectCreateInput,
  ProjectUpdateInput,
  ProjectVisibility,
  QueryDiscoverableStreamsArgs,
  SortDirection,
  StreamCreateInput,
  StreamUpdateInput
} from '@/modules/core/graph/generated/graphql'
import { Nullable, Optional } from '@/modules/shared/helpers/typeHelper'
import { decodeCursor, encodeCursor } from '@/modules/shared/helpers/graphqlHelper'
import dayjs from 'dayjs'
import cryptoRandomString from 'crypto-random-string'
import { Knex } from 'knex'
import { isProjectCreateInput } from '@/modules/core/helpers/stream'
import { StreamAccessUpdateError } from '@/modules/core/errors/stream'
import { metaHelpers } from '@/modules/core/helpers/meta'
import { UserWithRole } from '@/modules/core/repositories/users'
import { removePrivateFields } from '@/modules/core/helpers/userHelper'

export type StreamWithOptionalRole = StreamRecord & {
  /**
   * Available, if query joined this data StreamAcl
   */
  role?: StreamRoles
}

/**
 * List of base columns to select when querying for user streams
 * (expects join to StreamAcl)
 */
export const STREAM_WITH_OPTIONAL_ROLE_COLUMNS = [...Streams.cols, StreamAcl.col.role]

export const generateId = () => cryptoRandomString({ length: 10 })

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

/**
 * Get multiple streams. If userId is specified, the role will be resolved as well.
 */
export async function getStreams(
  streamIds: string[],
  options: Partial<{ userId: string; trx: Knex.Transaction }> = {}
) {
  const { userId, trx } = options
  if (!streamIds?.length) throw new InvalidArgumentError('Empty stream IDs')

  const q = Streams.knex<StreamWithOptionalRole[]>().whereIn(Streams.col.id, streamIds)

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
    q.groupBy(Streams.col.id)
  }

  if (trx) {
    q.transacting(trx)
  }

  return await q
}

/**
 * Get a single stream. If userId is specified, the role will be resolved as well.
 */
export async function getStream(
  params: { streamId?: string; userId?: string },
  options?: Partial<{ trx: Knex.Transaction }>
): Promise<Optional<StreamWithOptionalRole>> {
  const { streamId, userId } = params
  if (!streamId) throw new InvalidArgumentError('Invalid stream ID')

  const streams = await getStreams([streamId], { userId, ...(options || {}) })
  return <Optional<StreamWithOptionalRole>>streams[0]
}

export type StreamWithCommitId = StreamWithOptionalRole & { commitId: string }

export async function getCommitStreams(params: {
  commitIds: string[]
  userId?: string
}) {
  const { commitIds, userId } = params
  if (!commitIds?.length) return []

  const q = StreamCommits.knex()
    .select<Array<StreamWithCommitId>>([...Streams.cols, StreamCommits.col.commitId])
    .innerJoin(Streams.name, Streams.col.id, StreamCommits.col.streamId)
    .whereIn(StreamCommits.col.commitId, commitIds)

  if (userId) {
    q.select([
      // Getting first role from grouped results
      knex.raw(`(array_agg("stream_acl"."role"))[1] as role`)
    ])
    q.leftJoin(StreamAcl.name, function () {
      this.on(StreamAcl.col.resourceId, Streams.col.id).andOnVal(
        StreamAcl.col.userId,
        userId
      )
    })
    q.groupBy(Streams.col.id, StreamCommits.col.commitId)
  }

  const results = await q
  return results
}

export async function getCommitStream(params: { commitId: string; userId?: string }) {
  const { commitId } = params
  if (!commitId) throw new InvalidArgumentError('Invalid commit ID')

  const results = await getCommitStreams({
    commitIds: [commitId],
    userId: params.userId
  })
  return <Optional<StreamWithCommitId>>results[0]
}

/**
 * Get base query for finding or counting user favorited streams
 * @param {string} userId The user's ID
 */
function getFavoritedStreamsQueryBase<
  Result = Array<StreamFavoriteRecord & StreamRecord & StreamAclRecord>
>(userId: string, streamIdWhitelist?: Optional<string[]>) {
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

  if (streamIdWhitelist?.length) {
    query.whereIn(Streams.col.id, streamIdWhitelist)
  }

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
  streamIdWhitelist?: Optional<string[]>
}) {
  const { userId, cursor, limit, streamIdWhitelist } = params
  const finalLimit = _.clamp(limit || 25, 1, 25)
  const query = getFavoritedStreamsQueryBase<
    Array<StreamWithOptionalRole & { favoritedDate: Date; favCursor: string }>
  >(userId, streamIdWhitelist)
  query
    .select([
      ...STREAM_WITH_OPTIONAL_ROLE_COLUMNS,
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
export async function getFavoritedStreamsCount(
  userId: string,
  streamIdWhitelist?: Optional<string[]>
) {
  const query = getFavoritedStreamsQueryBase<[{ count: string }]>(
    userId,
    streamIdWhitelist
  )
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
  /**
   * Only allow streams with the specified IDs to be returned
   */
  streamIdWhitelist?: string[]
}

function buildDiscoverableStreamsBaseQuery<Result = Array<StreamRecord>>(
  params: GetDiscoverableStreamsParams
) {
  const q = Streams.knex()
    .select<Result>(Streams.cols)
    .where(Streams.col.isDiscoverable, true)
    .andWhere(Streams.col.isPublic, true)

  if (params.streamIdWhitelist?.length) {
    q.whereIn(Streams.col.id, params.streamIdWhitelist)
  }

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
export async function countDiscoverableStreams(params: GetDiscoverableStreamsParams) {
  const q = buildDiscoverableStreamsBaseQuery<{ count: string }[]>(params)
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
  const q = buildDiscoverableStreamsBaseQuery(params).limit(limit)

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
    .select<Array<UserWithRole & { streamRole: StreamRoles }>>([
      ...Users.cols,
      knex.raw(`${StreamAcl.col.role} as "streamRole"`),
      knex.raw(`(array_agg(${ServerAcl.col.role}))[1] as "role"`)
    ])
    .where(StreamAcl.col.resourceId, streamId)
    .innerJoin(Users.name, Users.col.id, StreamAcl.col.userId)
    .innerJoin(ServerAcl.name, ServerAcl.col.userId, Users.col.id)
    .groupBy(Users.col.id, StreamAcl.col.role)

  if (type) {
    q.andWhere(StreamAcl.col.role, type)
  }

  const items = (await q).map((i) => ({
    ...removePrivateFields(i),
    streamRole: i.streamRole,
    role: i.role
  }))
  return items
}

type BaseUserStreamsQueryParams = {
  /**
   * User whose streams we wish to find
   */
  userId: string
  /**
   * Filter streams by name/description/id
   */
  searchQuery?: string
  /**
   * Whether this data is retrieved for another user, and thus the data set
   * should be limited to only show publicly accessible (discoverable) streams
   */
  forOtherUser?: boolean
  /**
   * Only return streams owned by userId
   */
  ownedOnly?: boolean

  /**
   * Only return streams where user has the specified roles
   */
  withRoles?: StreamRoles[]

  /**
   * Only allow streams with the specified IDs to be returned
   */
  streamIdWhitelist?: string[]
}

export type UserStreamsQueryParams = BaseUserStreamsQueryParams & {
  /**
   * Max amount of streams per page. Defaults to 25, max is 50.
   */
  limit?: number
  /**
   * Pagination cursor
   */
  cursor?: string
}

export type UserStreamsQueryCountParams = BaseUserStreamsQueryParams

/**
 * Get base query for finding or counting user streams
 */
function getUserStreamsQueryBase<
  S extends StreamRecord = StreamRecord & StreamAclRecord
>({
  userId,
  searchQuery,
  forOtherUser,
  ownedOnly,
  withRoles,
  streamIdWhitelist
}: BaseUserStreamsQueryParams) {
  const query = StreamAcl.knex<Array<S>>()
    .where(StreamAcl.col.userId, userId)
    .join(Streams.name, StreamAcl.col.resourceId, Streams.col.id)

  if (ownedOnly || withRoles?.length) {
    const roles: StreamRoles[] = [
      ...(withRoles || []),
      ...(ownedOnly ? [Roles.Stream.Owner] : [])
    ]
    query.whereIn(StreamAcl.col.role, roles)
  }

  if (forOtherUser) {
    query
      .andWhere(Streams.col.isDiscoverable, true)
      .andWhere(Streams.col.isPublic, true)
  }

  if (searchQuery) {
    query.andWhere(function () {
      this.where(Streams.col.name, 'ILIKE', `%${searchQuery}%`)
        .orWhere(Streams.col.description, 'ILIKE', `%${searchQuery}%`)
        .orWhere(Streams.col.id, 'ILIKE', `%${searchQuery}%`) //potentially useless?
    })
  }

  if (streamIdWhitelist?.length) {
    query.whereIn(Streams.col.id, streamIdWhitelist)
  }

  return query
}

/**
 * Get streams the user is a collaborator on
 */
export async function getUserStreams(params: UserStreamsQueryParams) {
  const { limit, cursor } = params
  const finalLimit = clamp(limit || 25, 1, 50)

  const query = getUserStreamsQueryBase<StreamWithOptionalRole>(params)
  query.select(STREAM_WITH_OPTIONAL_ROLE_COLUMNS)

  if (cursor) query.andWhere(Streams.col.updatedAt, '<', cursor)

  query.orderBy(Streams.col.updatedAt, 'desc').limit(finalLimit)

  const rows = await query
  return {
    streams: rows,
    cursor: rows.length > 0 ? rows[rows.length - 1].updatedAt.toISOString() : null
  }
}

/**
 * Get the total amount of streams the user is a collaborator on
 */
export async function getUserStreamsCount(params: UserStreamsQueryCountParams) {
  const query = getUserStreamsQueryBase(params)
  const countQuery = query.count<{ count: string }[]>()

  const [res] = await countQuery
  return parseInt(res.count)
}

export async function createStream(
  input: StreamCreateInput | ProjectCreateInput,
  options?: Partial<{
    /**
     * If set, will assign owner permissions to this user
     */
    ownerId: string
    trx: Knex.Transaction
  }>
) {
  const { name, description, workspaceId } = input
  const { ownerId, trx } = options || {}

  let shouldBePublic: boolean, shouldBeDiscoverable: boolean
  if (isProjectCreateInput(input)) {
    shouldBeDiscoverable = input.visibility === ProjectVisibility.Public
    shouldBePublic =
      !input.visibility ||
      [ProjectVisibility.Public, ProjectVisibility.Unlisted].includes(input.visibility)
  } else {
    shouldBePublic = input.isPublic !== false
    shouldBeDiscoverable = input.isDiscoverable !== false && shouldBePublic
  }

  const id = generateId()
  const stream = {
    id,
    name: name || generateStreamName(),
    description: description || '',
    isPublic: shouldBePublic,
    isDiscoverable: shouldBeDiscoverable,
    updatedAt: knex.fn.now(),
    workspaceId: workspaceId || null
  }

  // Create the stream & set up permissions
  const streamQuery = Streams.knex().insert(stream, '*')
  if (trx) streamQuery.transacting(trx)

  const insertResults = await streamQuery
  const newStream = insertResults[0] as StreamRecord

  if (ownerId) {
    const streamAclQuery = StreamAcl.knex().insert({
      userId: ownerId,
      resourceId: id,
      role: Roles.Stream.Owner
    })
    if (trx) streamAclQuery.transacting(trx)
    await streamAclQuery
  }

  return newStream
}

export async function getUserStreamCounts(params: {
  userIds: string[]
  /**
   * If true, will only count public & discoverable streams
   */
  publicOnly?: boolean
}) {
  const { userIds, publicOnly = false } = params
  if (!userIds.length) return {}

  const q = StreamAcl.knex()
    .select<{ userId: string; count: string }[]>([
      StreamAcl.col.userId,
      knex.raw('COUNT(*)')
    ])
    .whereIn(StreamAcl.col.userId, userIds)
    .groupBy(StreamAcl.col.userId)

  if (publicOnly) {
    q.join(Streams.name, Streams.col.id, StreamAcl.col.resourceId).andWhere((q1) => {
      q1.where(Streams.col.isPublic, true).orWhere(Streams.col.isDiscoverable, true)
    })
  }

  const results = await q
  return _.mapValues(_.keyBy(results, 'userId'), (r) => parseInt(r.count))
}

export async function deleteStream(streamId: string) {
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
  return await Streams.knex().where(Streams.col.id, streamId).del()
}

export async function getStreamsSourceApps(streamIds: string[]) {
  if (!streamIds?.length) return {}

  const q = Streams.knex()
    .select<{ id: string; sourceApplication: string }[]>([
      Streams.col.id,
      Commits.col.sourceApplication
    ])
    .whereIn(Streams.col.id, streamIds)
    .whereNotNull(Commits.col.sourceApplication)
    .innerJoin(StreamCommits.name, StreamCommits.col.streamId, Streams.col.id)
    .innerJoin(Commits.name, StreamCommits.col.commitId, Commits.col.id)

  const results = await q
  const mappedToSets = reduce(
    results,
    (result, item) => {
      const set = result[item.id] || new Set<string>()
      if (item.sourceApplication?.length) set.add(item.sourceApplication)
      result[item.id] = set

      return result
    },
    {} as Record<string, Set<string>>
  )
  return mapValues(mappedToSets, (v) => [...v.values()])
}

const isProjectUpdateInput = (
  i: StreamUpdateInput | ProjectUpdateInput
): i is ProjectUpdateInput => has(i, 'visibility')

export async function updateStream(update: StreamUpdateInput | ProjectUpdateInput) {
  const { id: streamId } = update

  if (!update.name) update.name = null // to prevent saving name ''
  const validUpdate: Partial<StreamRecord> & Record<string, unknown> = omitBy(
    update,
    (v) => isNull(v) || isUndefined(v)
  )

  if (isProjectUpdateInput(update)) {
    if (has(validUpdate, 'visibility')) {
      validUpdate.isPublic = update.visibility !== ProjectVisibility.Private
      validUpdate.isDiscoverable = update.visibility === ProjectVisibility.Public
      delete validUpdate['visibility'] // cause it's not a real column
    }
  } else {
    if (has(validUpdate, 'isPublic') && !validUpdate.isPublic) {
      validUpdate.isDiscoverable = false
    }
  }

  if (has(validUpdate, 'isPublic') && !validUpdate.isPublic) {
    validUpdate.allowPublicComments = false
  } else if (
    has(validUpdate, 'allowPublicComments') &&
    validUpdate.allowPublicComments
  ) {
    validUpdate.isPublic = true
  }

  if (!Object.keys(validUpdate).length) return null

  const [updatedStream] = await Streams.knex()
    .returning('*')
    .where({ id: streamId })
    .update<StreamRecord[]>({
      ...validUpdate,
      updatedAt: knex.fn.now()
    })

  return updatedStream
}

export async function markBranchStreamUpdated(branchId: string) {
  const q = Streams.knex()
    .whereIn(Streams.col.id, (w) => {
      w.select(Branches.col.streamId)
        .from(Branches.name)
        .where(Branches.col.id, branchId)
    })
    .update(Streams.withoutTablePrefix.col.updatedAt, new Date())
  const updates = await q
  return updates > 0
}

export async function markCommitStreamUpdated(commitId: string) {
  const q = Streams.knex()
    .whereIn(Streams.col.id, (w) => {
      w.select(StreamCommits.col.streamId)
        .from(StreamCommits.name)
        .where(StreamCommits.col.commitId, commitId)
    })
    .update(Streams.withoutTablePrefix.col.updatedAt, new Date())
  const updates = await q
  return updates > 0
}

/**
 * (Moved from services/streams.js, could be refactored into something better)
 */
export async function grantStreamPermissions(params: {
  streamId: string
  userId: string
  role: StreamRoles
}) {
  const { streamId, userId, role } = params

  // upserts the existing role (sets a new one!)
  // TODO: check if we're removing the last owner (ie, does the stream still have an owner after this operation)?
  const query =
    StreamAcl.knex().insert({ userId, resourceId: streamId, role }).toString() +
    ' on conflict on constraint stream_acl_pkey do update set role=excluded.role'

  await knex.raw(query)

  // update stream updated at
  const streams = await Streams.knex()
    .where({ id: streamId })
    .update({ updatedAt: knex.fn.now() }, '*')

  return streams[0] as StreamRecord
}

/**
 * (Moved from services/streams.js, could be refactored into something better)
 */
export async function revokeStreamPermissions(params: {
  streamId: string
  userId: string
}) {
  const { streamId, userId } = params

  const [streamAclEntriesCount] = await StreamAcl.knex()
    .where({ resourceId: streamId })
    .count<{ count: string }[]>()

  if (parseInt(streamAclEntriesCount.count) === 1)
    throw new StreamAccessUpdateError(
      'Stream has only one ownership link left - cannot revoke permissions.',
      { info: { streamId, userId } }
    )

  const aclEntry = await StreamAcl.knex()
    .where({ resourceId: streamId, userId })
    .select<StreamAclRecord[]>('*')
    .first()

  if (aclEntry?.role === Roles.Stream.Owner) {
    const [countObj] = await StreamAcl.knex()
      .where({
        resourceId: streamId,
        role: Roles.Stream.Owner
      })
      .count()
    if (parseInt(countObj.count) === 1)
      throw new StreamAccessUpdateError('Could not revoke permissions for last admin', {
        info: { streamId, userId }
      })
    else {
      await StreamAcl.knex().where({ resourceId: streamId, userId }).del()
    }
  } else {
    const delCount = await StreamAcl.knex()
      .where({ resourceId: streamId, userId })
      .del()

    if (delCount === 0)
      throw new StreamAccessUpdateError('Could not revoke permissions for user', {
        info: { streamId, userId }
      })
  }

  // update stream updated at
  const [stream] = await Streams.knex()
    .where({ id: streamId })
    .update({ updatedAt: knex.fn.now() }, '*')

  return stream as StreamRecord
}

/**
 * Mark stream as the onboarding base stream from which user onboarding streams will be cloned
 */
export async function markOnboardingBaseStream(streamId: string, version: string) {
  const stream = await getStream({ streamId })
  if (!stream) {
    throw new Error(`Stream ${streamId} not found`)
  }
  await updateStream({
    id: streamId,
    name: 'Onboarding Stream Local Source - Do Not Delete'
  })
  const meta = metaHelpers(Streams)
  await meta.set(streamId, Streams.meta.metaKey.onboardingBaseStream, version)
}

/**
 * Get onboarding base stream, if any
 */
export async function getOnboardingBaseStream(version: string) {
  const q = Streams.knex()
    .select<StreamRecord[]>(Streams.cols)
    .innerJoin(Streams.meta.name, Streams.meta.col.streamId, Streams.col.id)
    .where(Streams.meta.col.key, Streams.meta.metaKey.onboardingBaseStream)
    .andWhereRaw(`${Streams.meta.col.value}::text = ?`, JSON.stringify(version))
    .first()

  return await q
}
