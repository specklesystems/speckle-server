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
  knex: <TResult = any>(db?: Knex) => Knex.QueryBuilder<any, TResult>
  /**
   * Get names of table columns. The names can be prefixed with the table name or not, depending
   * on whether `withoutTablePrefix` was set when accessing the helper.
   */
  col: {
    [colName in C]: string
  }

  /**
   * Build a "col AS alias" definition that can be used in .select() calls and .where() clauses
   */
  colAs<A extends string>(colName: C, alias: A): Knex.Raw

  /**
   * Use in .select() calls when selecting joined tables to ensure all table's rows get collected into a single
   * array and held in a key identified by name.
   *
   * Make sure the rows of this table are grouped, otherwise this aggregation won't work
   */
  groupArray(name: string): Knex.Raw

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
    [keyName in MK]: keyName
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

  /**
   * Configure a custom table prefix that will be attached to column names. This will be relevant when you're
   * building subqueries or joining a table onto itself.
   */
  withCustomTablePrefix?: string
}

const createBaseInnerSchemaConfigBuilder =
  <T extends string, C extends string>(tableName: T, columns: C[]) =>
  (params: SchemaConfigParams = {}): BaseInnerSchemaConfig<T, C> => {
    const aliasedTableName = params.withCustomTablePrefix
      ? `${tableName} as ${params.withCustomTablePrefix}`
      : tableName

    const prefix = params.withoutTablePrefix
      ? null
      : params.withCustomTablePrefix || tableName

    const colName = (col: string, options?: Partial<{ addQuotes: boolean }>) => {
      const { addQuotes } = options || {}

      return addQuotes
        ? (prefix?.length ? `"${prefix}".` : '') + `"${col}"`
        : (prefix?.length ? `${prefix}.` : '') + `${col}`
    }

    return {
      name: aliasedTableName as T,
      knex: (db?: Knex) => (db || knex)(aliasedTableName),
      col: reduce(
        columns,
        (prev, curr) => {
          prev[curr] = colName(curr)
          return prev
        },
        {} as Record<C, string>
      ),
      colAs: (col, alias) =>
        knex.raw(`${colName(col, { addQuotes: true })} AS "${alias}"`),
      groupArray: (name) =>
        knex.raw(
          `array_agg(row_to_json(${
            (prefix?.length ? prefix + '.' : '') + '*'
          })) as "${name}"`
        ),
      cols: columns.map((c) => colName(c))
    }
  }

/**
 * Create table schema helper
 * @param tableName
 * @param columns
 */
export function buildTableHelper<
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
export function buildMetaTableHelper<
  T extends string,
  C extends string,
  MK extends string
>(
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
      [...metaKeys, ...baseColumns],
      (prev, curr) => {
        prev[curr] = curr
        return prev
      },
      {} as Record<keyof BaseMetaRecord | MK, keyof BaseMetaRecord | MK>
    ) as { [keyName in MK]: keyName },
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

export const StreamsMeta = buildMetaTableHelper(
  'streams_meta',
  ['streamId', 'key', 'value', 'createdAt', 'updatedAt'],
  ['onboardingBaseStream'],
  'streamId'
)

export const Streams = buildTableHelper(
  'streams',
  [
    'id',
    'name',
    'description',
    'isPublic',
    'clonedFrom',
    'createdAt',
    'updatedAt',
    'allowPublicComments',
    'isDiscoverable',
    'workspaceId',
    'regionKey'
  ],
  StreamsMeta
)

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
  ['isOnboardingFinished', 'foo', 'bar', 'onboardingStreamId'],
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
    'ip'
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
  'updatedAt',
  'message',
  'resource',
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

export const PersonalApiTokens = buildTableHelper('personal_api_tokens', [
  'tokenId',
  'userId'
])

export const UserServerAppTokens = buildTableHelper('user_server_app_tokens', [
  'appId',
  'userId',
  'tokenId'
])

export const TokenScopes = buildTableHelper('token_scopes', ['tokenId', 'scopeName'])

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

export const FileUploads = buildTableHelper('file_uploads', [
  'id',
  'streamId',
  'branchName',
  'userId',
  'fileName',
  'fileType',
  'fileSize',
  'uploadComplete',
  'uploadDate',
  'convertedStatus',
  'convertedLastUpdate',
  'convertedMessage',
  'convertedCommitId'
])

export const ServerAppsScopes = buildTableHelper('server_apps_scopes', [
  'appId',
  'scopeName'
])

export const ServerApps = buildTableHelper('server_apps', [
  'id',
  'secret',
  'name',
  'description',
  'termsAndConditionsLink',
  'logo',
  'public',
  'trustByDefault',
  'authorId',
  'createdAt',
  'redirectUrl'
])

export const Scopes = buildTableHelper('scopes', ['name', 'description', 'public'])

export const TokenResourceAccess = buildTableHelper('token_resource_access', [
  'tokenId',
  'resourceType',
  'resourceId'
])

export const AutomationFunctionRuns = buildTableHelper('automation_function_runs', [
  'id',
  'runId',
  'functionReleaseId',
  'functionId',
  'elapsed',
  'status',
  'contextView',
  'statusMessage',
  'results',
  'createdAt',
  'updatedAt'
])

export const AutomationRevisionFunctions = buildTableHelper(
  'automation_revision_functions',
  ['automationRevisionId', 'functionReleaseId', 'functionInputs', 'functionId']
)

export const AutomationRevisions = buildTableHelper('automation_revisions', [
  'id',
  'automationId',
  'active',
  'createdAt',
  'userId',
  'publicKey'
])

export const AutomationTokens = buildTableHelper('automation_tokens', [
  'automationId',
  'automateToken'
])

export const AutomationRuns = buildTableHelper('automation_runs', [
  'id',
  'automationRevisionId',
  'createdAt',
  'updatedAt',
  'status',
  'executionEngineRunId'
])

export const AutomationTriggers = buildTableHelper('automation_triggers', [
  'automationRevisionId',
  'triggerType',
  'triggeringId'
])

export const AutomationRunTriggers = buildTableHelper('automation_run_triggers', [
  'automationRunId',
  'triggerType',
  'triggeringId'
])

export const Automations = buildTableHelper('automations', [
  'id',
  'name',
  'projectId',
  'enabled',
  'createdAt',
  'updatedAt',
  'userId',
  'executionEngineAutomationId',
  'isTestAutomation'
])

export const GendoAIRenders = buildTableHelper('gendo_ai_renders', [
  'id',
  'userId',
  'projectId',
  'modelId',
  'versionId',
  'createdAt',
  'updatedAt',
  'gendoGenerationId',
  'status',
  'prompt',
  'camera',
  'baseImage',
  'responseImage'
])

export const UserEmails = buildTableHelper('user_emails', [
  'id',
  'email',
  'primary',
  'verified',
  'userId',
  'createdAt',
  'updatedAt'
])

export const UserRoles = buildTableHelper('user_roles', [
  'name',
  'description',
  'resourceTarget',
  'aclTableName',
  'weight',
  'public'
])

export { knex }
