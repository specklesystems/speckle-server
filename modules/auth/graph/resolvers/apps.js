'use strict'
const appRoot = require( 'app-root-path' )
const { getApp } = require( '../../services/apps' )

const { createAppToken } = require( `${appRoot}/modules/core/services/tokens` )
const { createAuthorizationCode, exchangeAuthorizationCodeForToken } = require( `../../services/apps` )
const { validateServerRole, validateScopes, authorizeResolver } = require( `${appRoot}/modules/shared` )
const { authStrategies } = require( '../../index' )

module.exports = {
  Query: {
    async app( parent, args, context, info ) {
      // TODO: check authorization
      // If user === owner, return full app, otherwise delete the secret!
      let app = await getApp( { id: args.id } )
      return app
    }
  },
  ServerApp: {
    secret( parent, args, context, info ) {
      if ( parent.author.id === context.user.id )
        return parent.secret
      return 'App secrets are only revealed to their author.'
    }
  },
  User: {
    async authorizedApps( parent, args, context, info ) {
      // TODO
    },
    async createdApps( parent, args, context, info ) {
      // TODO
    }
  },
  Mutation: {
    async appCreate( parent, args, context, info ) {

    },
    async appUpdate( parent, args, context, info ) {
      // restrict to owner
    },
    async appDelete( parent, args, context, info ) {
      // TODO
      // restrict to owner
    },
  }
}
