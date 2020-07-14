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
    async appAuthorize( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'apps:authorize' ) // TODO

      // Implicit grant flow: returns the token directly
      // let token = await createAppToken( { userId: context.userId, appId: args.appId } )
      // return token

      // TODO: Implement authorization code grant
      let accessCode = await createAuthorizationCode( { userId: contex.userId, appId: args.appId, challenge: args.challenge } )
      return accessCode
    },
    async appGetToken( parent, args, context, info ) {

      let result = await exchangeAuthorizationCodeForToken( { appId: args.appId, appSecret: args.appSecret, accessCode: args.accessCode, challenge: args.challenge } )
      // args.appId, args.appSecret, args.accessCode

    },
    async appRefreshToken( parent, args, context, info ) {
      // TODO
    }
  }
}