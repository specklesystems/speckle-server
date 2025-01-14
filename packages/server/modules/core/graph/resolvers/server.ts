import { validateScopes } from '@/modules/shared'
import { Roles, Scopes, RoleInfo, removeNullOrUndefinedKeys } from '@speckle/shared'
import { throwForNotHavingServerRole } from '@/modules/shared/authz'
import {
  speckleAutomateUrl,
  enableNewFrontendMessaging
} from '@/modules/shared/helpers/envHelper'
import {
  getServerInfoFactory,
  updateServerInfoFactory,
  getPublicRolesFactory,
  getPublicScopesFactory,
  getServerConfigWithCacheFactory
} from '@/modules/core/repositories/server'
import { db } from '@/db/knex'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import type { ServerConfigRecord } from '@/modules/core/helpers/types'
import TTLCache from '@isaacs/ttlcache'

const cache = new TTLCache<string, ServerConfigRecord>({ max: 1, ttl: 60 * 1000 })
const getServerInfo = getServerInfoFactory({
  getServerConfig: getServerConfigWithCacheFactory({ inMemoryCache: cache, db })
})
const updateServerInfo = updateServerInfoFactory({ db })
const getPublicRoles = getPublicRolesFactory({ db })
const getPublicScopes = getPublicScopesFactory({ db })

export = {
  Query: {
    async serverInfo() {
      return await getServerInfo()
    }
  },
  ServerInfo: {
    async roles() {
      return await getPublicRoles()
    },

    async scopes() {
      return await getPublicScopes()
    },

    async serverRoles(parent) {
      const { guestModeEnabled } = parent
      return Object.values(Roles.Server)
        .filter((role) => guestModeEnabled || role !== Roles.Server.Guest)
        .map((r) => ({
          id: r,
          title: RoleInfo.Server[r].title
        }))
    },
    automateUrl() {
      return speckleAutomateUrl()
    },
    enableNewWebUiMessaging() {
      return enableNewFrontendMessaging()
    }
  },

  Mutation: {
    async serverInfoUpdate(_parent, args, context) {
      await throwForNotHavingServerRole(context, Roles.Server.Admin)
      await validateScopes(context.scopes, Scopes.Server.Setup)

      const update = removeNullOrUndefinedKeys(args.info)
      await updateServerInfo(update)
      // we're currently going to ignore, that this should be propagated to all
      // backend instances, and going to rely on the TTL in the cache to propagate the changes
      cache.clear()
      return true
    },
    serverInfoMutations: () => ({})
  }
} as Resolvers
