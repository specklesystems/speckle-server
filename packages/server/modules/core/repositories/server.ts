import { ScopeRecord } from '@/modules/auth/helpers/types'
import { buildTableHelper, Scopes, UserRoles } from '@/modules/core/dbSchema'
import {
  GetPublicRoles,
  GetPublicScopes,
  GetServerInfo,
  UpdateServerInfo
} from '@/modules/core/domain/server/operations'
import { ServerInfo } from '@/modules/core/domain/server/types'
import { ServerConfigRecord } from '@/modules/core/helpers/types'
import { UserRole } from '@/modules/shared/domain/rolesAndScopes/types'
import {
  getFileSizeLimitMB,
  getMaximumObjectSizeMB,
  getServerMovedFrom,
  getServerMovedTo,
  getServerOrigin,
  getServerVersion
} from '@/modules/shared/helpers/envHelper'
import Redis from 'ioredis'
import { Knex } from 'knex'
import { layeredCacheFactory } from '@/modules/core/utils/layeredCache'
import TTLCache from '@isaacs/ttlcache'

const ServerConfig = buildTableHelper('server_config', [
  'id',
  'name',
  'company',
  'description',
  'adminContact',
  'termsOfService',
  'canonicalUrl',
  'completed',
  'inviteOnly',
  'guestModeEnabled'
])

const tables = {
  serverConfig: (db: Knex) => db<ServerConfigRecord>(ServerConfig.name),
  userRoles: (db: Knex) => db<UserRole>(UserRoles.name),
  scopes: (db: Knex) => db<ScopeRecord>(Scopes.name)
}

const SERVER_CONFIG_CACHE_KEY = 'server_config'

export type GetServerConfig = (params?: {
  bustCache?: boolean
}) => Promise<ServerConfigRecord>

export const getServerConfigFactory =
  (deps: { db: Knex }): GetServerConfig =>
  async () =>
    // ignore the bustCache parameter, as it will never be cached i.e. defaults to true
    // An entry should always exist, as one is inserted via db migrations
    (await tables.serverConfig(deps.db).select('*').first())!

//instantiate the cache in the module scope, so it is shared across all server config factories
const inMemoryCache = new TTLCache<string, ServerConfigRecord>({
  max: 1 //because we only ever use one key, SERVER_CONFIG_CACHE_KEY
})

export const getServerConfigWithCacheFactory = (deps: {
  db: Knex
  distributedCache?: Redis
}): GetServerConfig => {
  const { db, distributedCache } = deps

  const getFromSourceOrCache = layeredCacheFactory<ServerConfigRecord>({
    inMemoryCache,
    distributedCache,
    options: {
      inMemoryExpiryTimeSeconds: 2,
      redisExpiryTimeSeconds: 60
    },
    retrieveFromSource: async () => {
      // An entry should always exist, as one is inserted via db migrations
      return getServerConfigFactory({ db })()
    }
  })
  return async (params) => {
    return await getFromSourceOrCache({
      key: SERVER_CONFIG_CACHE_KEY,
      bustCache: params?.bustCache
    })
  }
}

export const getServerInfoFactory =
  (deps: { getServerConfig: GetServerConfig }): GetServerInfo =>
  async () => {
    const movedTo = getServerMovedTo()
    const movedFrom = getServerMovedFrom()

    const serverConfig = await deps.getServerConfig({ bustCache: false })

    // An entry should always exist from migrations
    const serverInfo: ServerInfo = {
      ...serverConfig,
      version: getServerVersion(),
      canonicalUrl: getServerOrigin(),
      configuration: {
        objectSizeLimitBytes: getMaximumObjectSizeMB() * 1024 * 1024,
        objectMultipartUploadSizeLimitBytes: getFileSizeLimitMB() * 1024 * 1024
      },
      ...(movedTo || movedFrom
        ? {
            migration: {
              movedFrom: movedFrom?.toString(),
              movedTo: movedTo?.toString()
            }
          }
        : {})
    }

    return serverInfo
  }

export const updateServerInfoFactory =
  (deps: { db: Knex }): UpdateServerInfo =>
  async ({
    name,
    company,
    description,
    adminContact,
    termsOfService,
    inviteOnly,
    guestModeEnabled
  }) => {
    const serverInfo = await tables.serverConfig(deps.db).select('*').first()
    if (!serverInfo) {
      await tables.serverConfig(deps.db).insert(
        {
          name,
          company,
          description,
          adminContact,
          termsOfService,
          inviteOnly,
          guestModeEnabled,
          completed: true
        },
        '*'
      )
    } else {
      await tables.serverConfig(deps.db).where({ id: 0 }).update({
        name,
        company,
        description,
        adminContact,
        termsOfService,
        inviteOnly,
        guestModeEnabled,
        completed: true
      })
    }
  }

export const getPublicRolesFactory =
  (deps: { db: Knex }): GetPublicRoles =>
  async () => {
    return await tables.userRoles(deps.db).select('*').where({ public: true })
  }

export const getPublicScopesFactory =
  (deps: { db: Knex }): GetPublicScopes =>
  async () => {
    return await tables.scopes(deps.db).select('*').where({ public: true })
  }
