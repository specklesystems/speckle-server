'use strict'
const appRoot = require( 'app-root-path' )
const { validateServerRole, validateScopes } = require( `${appRoot}/modules/shared` )
const { getStreamHistory, getCommitHistory, getObjectHistory, getUserHistory, getTotalStreamCount, getTotalCommitCount, getTotalObjectCount, getTotalUserCount } = require( '../../services' )


module.exports = {
  Query: {
    async serverStats( parent, args, context, info ) {

      await validateServerRole( context, 'server:admin' )
      await validateScopes( context.scopes, 'server:stats' )
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
