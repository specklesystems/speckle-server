import { validateScopes } from '@/modules/shared'
import { Roles, Scopes, RoleInfo, removeNullOrUndefinedKeys } from '@speckle/shared'
import { throwForNotHavingServerRole } from '@/modules/shared/authz'
import {
  speckleAutomateUrl,
  enableNewFrontendMessaging
} from '@/modules/shared/helpers/envHelper'
import {
  updateServerInfoFactory as updateServerInfoRepoFactory,
  getPublicRolesFactory,
  getPublicScopesFactory,
  getCachedServerInfoFactory
} from '@/modules/core/repositories/server'
import { db } from '@/db/knex'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { withOperationLogging } from '@/observability/domain/businessLogging'
import { updateServerInfoFactory } from '@/modules/core/services/server/serverInfo'

const getServerInfo = getCachedServerInfoFactory({ db })
const updateServerInfo = updateServerInfoFactory({
  updateServerInfo: updateServerInfoRepoFactory({ db })
})
const getPublicRoles = getPublicRolesFactory({ db })
const getPublicScopes = getPublicScopesFactory({ db })

export default {
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

      await withOperationLogging(
        async () => await updateServerInfo(removeNullOrUndefinedKeys(args.info)),
        {
          logger: context.log,
          operationName: 'updateServerInfo',
          operationDescription: `Update server info`
        }
      )

      // clear cache
      await getServerInfo.clear()

      return true
    },
    serverInfoMutations: () => ({})
  }
} as Resolvers
