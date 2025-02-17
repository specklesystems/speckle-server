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
  getServerInfoFromCacheFactory,
  storeServerInfoInCacheFactory
} from '@/modules/core/repositories/server'
import { db } from '@/db/knex'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { LRUCache } from 'lru-cache'
import { ServerInfo } from '@/modules/core/helpers/types'

const cache = new LRUCache<string, ServerInfo>({ max: 1, ttl: 60 * 1000 })
const getServerInfoFromCache = getServerInfoFromCacheFactory({ cache })
const storeServerInfoInCache = storeServerInfoInCacheFactory({ cache })
const getServerInfo = getServerInfoFactory({ db })
const updateServerInfo = updateServerInfoFactory({ db })
const getPublicRoles = getPublicRolesFactory({ db })
const getPublicScopes = getPublicScopesFactory({ db })

export = {
  Query: {
    async serverInfo() {
      const cachedServerInfo = getServerInfoFromCache()
      if (cachedServerInfo) return cachedServerInfo
      const serverInfo = await getServerInfo()
      storeServerInfoInCache({ serverInfo })
      return serverInfo
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
