'use strict'
const { validateScopes } = require('@/modules/shared')
const {
  getStreamHistory,
  getCommitHistory,
  getObjectHistory,
  getUserHistory,
  getTotalStreamCount,
  getTotalCommitCount,
  getTotalObjectCount,
  getTotalUserCount
} = require('../../services')
const { Roles, Scopes } = require('@speckle/shared')
const { throwForNotHavingServerRole } = require('@/modules/shared/authz')

module.exports = {
  Query: {
    /**
     * @deprecated('Use admin.serverStatistics')
     */
    async serverStats(parent, args, context) {
      await throwForNotHavingServerRole(context, Roles.Server.Admin)
      await validateScopes(context.scopes, Scopes.Server.Stats)
      return {}
    }
  },

  ServerStats: {
    async totalStreamCount() {
      return await getTotalStreamCount()
    },

    async totalCommitCount() {
      return await getTotalCommitCount()
    },

    async totalObjectCount() {
      return await getTotalObjectCount()
    },

    async totalUserCount() {
      return await getTotalUserCount()
    },

    async streamHistory() {
      return await getStreamHistory()
    },

    async commitHistory() {
      return await getCommitHistory()
    },

    async objectHistory() {
      return await getObjectHistory()
    },

    async userHistory() {
      return await getUserHistory()
    }
  }
}
