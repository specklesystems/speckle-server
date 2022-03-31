'use strict'
const appRoot = require('app-root-path')
const {
  validateServerRole,
  validateScopes,
} = require(`${appRoot}/modules/shared`)
const {
  updateServerInfo,
  getServerInfo,
  getPublicScopes,
  getPublicRoles
} = require('../../services/generic')

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
      await validateServerRole(context, 'server:admin')
      await validateScopes(context.scopes, 'server:setup')

      await updateServerInfo(args.info)
      return true
    }
  }
}
