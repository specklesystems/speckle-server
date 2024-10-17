'use strict'
const { validateScopes } = require('@/modules/shared')
const {
  updateServerInfo,
  getPublicScopes,
  getPublicRoles
} = require('../../services/generic')
const { Roles, Scopes, RoleInfo } = require('@speckle/shared')
const { throwForNotHavingServerRole } = require('@/modules/shared/authz')
const {
  speckleAutomateUrl,
  enableNewFrontendMessaging
} = require('@/modules/shared/helpers/envHelper')
const { getServerInfoFactory } = require('@/modules/core/repositories/server')
const { db } = require('@/db/knex')

const getServerInfo = getServerInfoFactory({ db })

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
    },
    enableNewWebUiMessaging() {
      return enableNewFrontendMessaging()
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
