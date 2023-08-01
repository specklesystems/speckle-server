'use strict'
const { validateScopes } = require('@/modules/shared')
const {
  updateServerInfo,
  getServerInfo,
  getPublicScopes,
  getPublicRoles
} = require('../../services/generic')
const { Roles, Scopes } = require('@speckle/shared')
const { throwForNotHavingServerRole } = require('@/modules/shared/authz')

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
