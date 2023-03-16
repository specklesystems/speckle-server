/* eslint-disable @typescript-eslint/no-explicit-any */
import { Optional } from '@speckle/shared'
import knex from '@/db/knex'
import { BaseMetaRecord } from '@/modules/core/helpers/meta'
import { Knex } from 'knex'
import { reduce } from 'lodash'

type BaseInnerSchemaConfig<T extends string, C extends string> = {
  /**
   * Table name
   */
  name: T
  /**
   * Get `knex(tableName)` QueryBuilder instance. Use the generic argument to type the results of the query.
   */
  knex: <TResult = any>() => Knex.QueryBuilder<any, TResult>
  /**
   * Get names of table columns. The names can be prefixed with the table name or not, depending
   * on whether `withoutTablePrefix` was set when accessing the helper.
   */
  col: {
    [colName in C]: string
  }

  /**
   * All of the column names in an array
   */
  cols: string[]
}

type BaseSchemaConfig<BC extends BaseInnerSchemaConfig<any, any>> = BC & {
  /**
   * Return schema helper with custom configuration options
   */
  with: (params?: SchemaConfigParams) => BC

  /**
   * Helper with withoutTablePrefix set to true
   */
  withoutTablePrefix: BC
}

type InnerSchemaConfig<
  T extends string,
  C extends string,
  M extends Optional<MetaSchemaConfig<any, any, any>>
> = BaseInnerSchemaConfig<T, C> & {
  /**
   * Associated meta table helper, if any
   */
  meta: M
}

export type SchemaConfig<
  T extends string,
  C extends string,
  M extends Optional<MetaSchemaConfig<any, any, any>>
> = BaseSchemaConfig<InnerSchemaConfig<T, C, M>>

type MetaInnerSchemaConfig<
  T extends string,
  C extends string,
  MK extends string
> = BaseInnerSchemaConfig<T, keyof BaseMetaRecord | C> & {
  /**
   * Get meta keys individually
   */
  metaKey: {
    [keyName in MK]: string
  }

  /**
   * Get all available meta keys
   */
  metaKeys: string[]

  /**
   * Column in the meta table that identifies an entity from the associated parent table.
   * E.g. In the users_meta table this column is 'user_id' - it identifies the user for which the meta value is stored
   */
  parentIdentityCol: string
}

export type MetaSchemaConfig<
  T extends string,
  C extends string,
  MK extends string
> = BaseSchemaConfig<MetaInnerSchemaConfig<T, C, MK>>

type SchemaConfigParams = {
  /**
   * Configure `col` properties to not have the table name prefixed. For the most part you want the prefix,
   * cause this helps in queries with JOINS (when multiple tables have a col with the same name), but you don't
   * want the prefix when triggering UPDATE queries, because the `SET <name> = <value>` syntax doesn't support
   * column names with table prefixes.
   */
  withoutTablePrefix?: boolean
}

const createBaseInnerSchemaConfigBuilder =
  <T extends string, C extends string>(tableName: T, columns: C[]) =>
  (params: SchemaConfigParams = {}): BaseInnerSchemaConfig<T, C> => {
    const colName = (col: string) =>
      params.withoutTablePrefix ? col : `${tableName}.${col}`

    return {
      name: tableName,
      knex: () => knex(tableName),
      col: reduce(
        columns,
        (prev, curr) => {
          prev[curr] = colName(curr)
          return prev
        },
        {} as Record<C, string>
      ),
      cols: columns.map(colName)
    }
  }

/**
 * Create table schema helper
 * @param tableName
 * @param columns
 */
function buildTableHelper<
  T extends string,
  C extends string,
  M extends Optional<MetaSchemaConfig<any, any, any>>
>(tableName: T, columns: C[], metaTable?: M): SchemaConfig<T, C, M> {
  const buildBaseConfig = createBaseInnerSchemaConfigBuilder(tableName, columns)
  const buildInnerConfig = (
    params: SchemaConfigParams = {}
  ): InnerSchemaConfig<T, C, M> => ({
    ...buildBaseConfig(params),
    meta: metaTable as M
  })

  return {
    ...buildInnerConfig(),
    with: buildInnerConfig,
    withoutTablePrefix: buildInnerConfig({ withoutTablePrefix: true })
  }
}

/**
 * Create meta table schema helper
 */
function buildMetaTableHelper<T extends string, C extends string, MK extends string>(
  tableName: T,
  extraColumns: C[],
  metaKeys: MK[],
  parentIdentityCol: C
): MetaSchemaConfig<T, C, MK> {
  const baseColumns: Array<keyof BaseMetaRecord> = [
    'key',
    'value',
    'createdAt',
    'updatedAt'
  ]
  const buildBaseConfig = createBaseInnerSchemaConfigBuilder(tableName, [
    ...extraColumns,
    ...baseColumns
  ])

  const buildInnerMetaConfig = (
    params: SchemaConfigParams = {}
  ): MetaInnerSchemaConfig<T, C, MK> => ({
    ...buildBaseConfig(params),
    metaKeys,
    metaKey: reduce(
      [...metaKeys, 'key', 'value', 'createdAt', 'updatedAt'] as Array<
        keyof BaseMetaRecord | MK
      >,
      (prev, curr) => {
        prev[curr] = curr
        return prev
      },
      {} as Record<keyof BaseMetaRecord | MK, string>
    ),
    parentIdentityCol
  })

  return {
    ...buildInnerMetaConfig(),
    with: buildInnerMetaConfig,
    withoutTablePrefix: buildInnerMetaConfig({ withoutTablePrefix: true })
  }
}

/*
 * TABLE HELPERS
 * The generated helpers are used like this:
 *
 * Streams.name - TableName
 * Streams.col.id - Get column names
 * Streams.knex() - Get knex() instance for this specific table
 *
 * Streams.with({...}) - configure helper, e.g. disable table name being prefixed to col names:
 * Streams.with({withoutTablePrefix: true}).col.id
 *
 * Streams.withoutTablePrefix.col.id - Shorthand for accessing columns without the table prefix
 *
 * META TABLE HELPERS
 * Largely the same, but also hold extra props like `metaKeys` that store allowed meta keys
 */

export const Streams = buildTableHelper('streams', [
  'id',
  'name',
  'description',
  'isPublic',
  'clonedFrom',
  'createdAt',
  'updatedAt',
  'allowPublicComments',
  'isDiscoverable'
])

export const StreamAcl = buildTableHelper('stream_acl', [
  'userId',
  'resourceId',
  'role'
])

export const StreamFavorites = buildTableHelper('stream_favorites', [
  'streamId',
  'userId',
  'createdAt',
  'cursor'
])

export const UsersMeta = buildMetaTableHelper(
  'users_meta',
  ['userId', 'key', 'value', 'createdAt', 'updatedAt'],
  ['isOnboardingFinished', 'foo', 'bar'],
  'userId'
)

export const Users = buildTableHelper(
  'users',
  [
    'id',
    'suuid',
    'createdAt',
    'name',
    'bio',
    'company',
    'email',
    'verified',
    'avatar',
    'profiles',
    'passwordDigest',
    'ip',
    'isOnboardingFinished'
  ],
  UsersMeta
)

export const ServerAcl = buildTableHelper('server_acl', ['userId', 'role'])

export const Comments = buildTableHelper('comments', [
  'id',
  'streamId',
  'authorId',
  'createdAt',
  'updatedAt',
  'text',
  'screenshot',
  'data',
  'archived',
  'parentComment'
])

export const CommentLinks = buildTableHelper('comment_links', [
  'commentId',
  'resourceId',
  'resourceType'
])

export const CommentViews = buildTableHelper('comment_views', [
  'commentId',
  'userId',
  'viewedAt'
])

export const ServerInvites = buildTableHelper('server_invites', [
  'id',
  'target',
  'inviterId',
  'createdAt',
  'used',
  'message',
  'resourceTarget',
  'resourceId',
  'role',
  'token'
])

export const PasswordResetTokens = buildTableHelper('pwdreset_tokens', [
  'id',
  'email',
  'createdAt'
])

export const RefreshTokens = buildTableHelper('refresh_tokens', [
  'id',
  'tokenDigest',
  'appId',
  'userId',
  'createdAt',
  'lifespan'
])

export const AuthorizationCodes = buildTableHelper('authorization_codes', [
  'id',
  'appId',
  'userId',
  'challenge',
  'createdAt',
  'lifespan'
])

export const ApiTokens = buildTableHelper('api_tokens', [
  'id',
  'tokenDigest',
  'owner',
  'name',
  'lastChars',
  'revoked',
  'lifespan',
  'createdAt',
  'lastUsed'
])

export const EmailVerifications = buildTableHelper('email_verifications', [
  'id',
  'email',
  'createdAt',
  'used'
])

export const ServerAccessRequests = buildTableHelper('server_access_requests', [
  'id',
  'requesterId',
  'resourceType',
  'resourceId',
  'createdAt',
  'updatedAt'
])

export const StreamActivity = buildTableHelper('stream_activity', [
  'streamId',
  'time',
  'resourceType',
  'resourceId',
  'actionType',
  'userId',
  'info',
  'message'
])

export const UserNotificationPreferences = buildTableHelper(
  'user_notification_preferences',
  ['userId', 'preferences']
)

export const Commits = buildTableHelper('commits', [
  'id',
  'referencedObject',
  'author',
  'message',
  'createdAt',
  'sourceApplication',
  'totalChildrenCount',
  'parents'
])

export const StreamCommits = buildTableHelper('stream_commits', [
  'streamId',
  'commitId'
])

export const BranchCommits = buildTableHelper('branch_commits', [
  'branchId',
  'commitId'
])

export const Branches = buildTableHelper('branches', [
  'id',
  'streamId',
  'authorId',
  'name',
  'description',
  'createdAt',
  'updatedAt'
])

export const ScheduledTasks = buildTableHelper('scheduled_tasks', [
  'taskName',
  'lockExpiresAt'
])

export const Objects = buildTableHelper('objects', [
  'id',
  'speckleType',
  'totalChildrenCount',
  'totalChildrenCountByDepth',
  'createdAt',
  'data',
  'streamId'
])

export { knex }
