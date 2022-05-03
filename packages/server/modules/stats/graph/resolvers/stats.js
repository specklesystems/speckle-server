'use strict'
const { validateServerRole, validateScopes } = require('@/modules/shared')
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

module.exports = {
  Query: {
    async serverStats(parent, args, context) {
      await validateServerRole(context, 'server:admin')
      await validateScopes(context.scopes, 'server:stats')
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
