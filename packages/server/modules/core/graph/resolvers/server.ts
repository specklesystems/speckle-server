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
  getPublicScopesFactory
} from '@/modules/core/repositories/server'
import { db } from '@/db/knex'
import { Resolvers } from '@/modules/core/graph/generated/graphql'

const getServerInfo = getServerInfoFactory({ db })
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
      return true
    },
    serverInfoMutations: () => ({})
  }
} as Resolvers
