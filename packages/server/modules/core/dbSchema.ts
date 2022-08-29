/* eslint-disable @typescript-eslint/no-explicit-any */
import knex from '@/db/knex'
import { Knex } from 'knex'
import { reduce } from 'lodash'

/**
 * TODO:
 * ServerInvites:
 *  - Get rid of the 'used' field, it's not used anymore
 */

type SchemaConfig<T extends string, C extends string> = InnerSchemaConfig<T, C> & {
  /**
   * Return schema helper with custom configuration options
   */
  with: (params?: SchemaConfigParams) => InnerSchemaConfig<T, C>

  /**
   * Helper with withoutTablePrefix set to true
   */
  withoutTablePrefix: InnerSchemaConfig<T, C>
}

type InnerSchemaConfig<T extends string, C extends string> = {
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

type SchemaConfigParams = {
  /**
   * Configure `col` properties to not have the table name prefixed. For the most part you want the prefix,
   * cause this helps in queries with JOINS (when multiple tables have a col with the same name), but you don't
   * want the prefix when triggering UPDATE queries, because the `SET <name> = <value>` syntax doesn't support
   * column names with table prefixes.
   */
  withoutTablePrefix?: boolean
}

function buildTableHelper<T extends string, C extends string>(
  tableName: T,
  columns: C[]
): SchemaConfig<T, C> {
  function buildInnerSchemaConfig(
    params: SchemaConfigParams = {}
  ): InnerSchemaConfig<T, C> {
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

  return {
    ...buildInnerSchemaConfig(),
    with: buildInnerSchemaConfig,
    withoutTablePrefix: buildInnerSchemaConfig({ withoutTablePrefix: true })
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

export const Users = buildTableHelper('users', [
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
  'ip'
])

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

export { knex }
