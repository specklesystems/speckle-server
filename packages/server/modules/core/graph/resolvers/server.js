'use strict'
const { validateScopes } = require('@/modules/shared')
const {
  updateServerInfo,
  getServerInfo,
  getPublicScopes,
  getPublicRoles
} = require('../../services/generic')
const { Roles, Scopes, RoleInfo } = require('@speckle/shared')
const { throwForNotHavingServerRole } = require('@/modules/shared/authz')
const { speckleAutomateUrl } = require('@/modules/shared/helpers/envHelper')

module.exports = {
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
          title: RoleInfo.Server[r]
        }))
    },
    automateUrl() {
      return speckleAutomateUrl()
    }
  },

  Mutation: {
    async serverInfoUpdate(parent, args, context) {
      await throwForNotHavingServerRole(context, Roles.Server.Admin)
      await validateScopes(context.scopes, Scopes.Server.Setup)

      await updateServerInfo(args.info)
      return true
    }
  }
}
