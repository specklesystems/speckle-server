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

export const getServerConfigFactory =
  (deps: { db: Knex; cache?: Redis }): GetServerConfig =>
  async (params) => {
    const { cache, db } = deps
    const { bustCache } = params
    if (cache && !bustCache) {
      const cachedResult = await cache.get(SERVER_CONFIG_CACHE_KEY)
      if (cachedResult) return JSON.parse(cachedResult) as ServerConfigRecord
    }
    if (cache && bustCache) {
      await cache.del(SERVER_CONFIG_CACHE_KEY)
    }
    const result = await tables.serverConfig(db).select('*').first()
    if (cache) {
      await cache.setex(
        SERVER_CONFIG_CACHE_KEY,
        60 /* seconds */,
        JSON.stringify(result)
      )
    }
    // An entry should always exist as it is placed there by database migrations
    return result!
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
