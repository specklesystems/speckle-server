'use strict'
import { validateScopes } from '@/modules/shared'
import {
  updateServerInfo,
  getServerInfo,
  getPublicScopes,
  getPublicRoles,
  ServerInfoParams
} from '@/modules/core/services/generic'
import { Roles, Scopes, RoleInfo } from '@speckle/shared'
import { throwForNotHavingServerRole } from '@/modules/shared/authz'
import { speckleAutomateUrl } from '@/modules/shared/helpers/envHelper'
import { AuthContext } from '@/modules/shared/authz'

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

    async serverRoles(parent: { guestModeEnabled: boolean }) {
      const { guestModeEnabled } = parent
      return Object.values(Roles.Server)
        .filter((role) => guestModeEnabled || role !== Roles.Server.Guest)
        .map((r) => ({
          id: r,
          title: RoleInfo.Server[r]
        }))
    },
    automateUrl() {
      return speckleAutomateUrl()
    }
  },

  Mutation: {
    async serverInfoUpdate(
      parent: never,
      args: { info: ServerInfoParams },
      context: AuthContext
    ) {
      await throwForNotHavingServerRole(context, Roles.Server.Admin)
      await validateScopes(context.scopes, Scopes.Server.Setup)

      await updateServerInfo(args.info)
      return true
    }
  }
}
