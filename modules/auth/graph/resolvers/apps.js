'use strict'
const appRoot = require( 'app-root-path' )
const { getApp } = require( '../../services/apps' )

const { createAppToken } = require( `${appRoot}/modules/core/services/tokens` )
const { createAuthorizationCode, exchangeAuthorizationCodeForToken } = require( `../../services/apps` )
const { validateServerRole, validateScopes, authorizeResolver } = require( `${appRoot}/modules/shared` )
const { authStrategies } = require( '../../index' )

module.exports = {
  Query: {
    async serverApp( parent, args, context, info ) {
      return await getApp( { id: args.id } )
    }
  },
  ServerInfo: {
    authStrategies( parent, args, context, info ) {
      return authStrategies
    }
  },
  Mutation: {
  }
}