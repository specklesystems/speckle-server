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

export type GetServerConfig = (params: {
  bustCache?: boolean
}) => Promise<ServerConfigRecord>

const cache = layeredCacheFactory<ServerConfigRecord>({
  options: {
    inMemoryExpiryTimeSeconds: 2,
    redisExpiryTimeSeconds: 60
  }
})

const inMemoryCache = new TTLCache<string, ServerConfigRecord>({
  max: 2000
})

export const getServerConfigFactory = (deps: {
  db: Knex
  distributedCache?: Redis
}): GetServerConfig => {
  const { db } = deps
  return async (params) => {
    return (await cache({
      key: SERVER_CONFIG_CACHE_KEY,
      inMemoryCache,
      distributedCache: deps.distributedCache,
      bustCache: params.bustCache,
      retrieveFromSource: async () => {
        return await tables.serverConfig(db).select('*').first()
      }
    }))!
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
