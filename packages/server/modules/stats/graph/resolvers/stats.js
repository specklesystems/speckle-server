'use strict'
const appRoot = require( 'app-root-path' )
const { validateServerRole, validateScopes, authorizeResolver } = require( `${appRoot}/modules/shared` )

module.exports = {
  Query: {
    async serverStats( parent, args, context, info ) {

      await validateServerRole( context, 'server:admin' )

      return {
        totalStreamsCount: 42,
        totalCommitCount: 42,
        totalObjectCount: 42,
        totalUserCount: 42,
        streamHistory: {},
        commitHistory: {},
        objectHistory: {},
        userHistory: {}
      }
    }
  }
}
