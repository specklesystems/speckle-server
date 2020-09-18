'use strict'
const appRoot = require( 'app-root-path' )
const { getApp } = require( '../../services/apps' )

const { createAppToken } = require( `${appRoot}/modules/core/services/tokens` )
const { createApp, updateApp, deleteApp, createAuthorizationCode, exchangeAuthorizationCodeForToken } = require( `../../services/apps` )
const { validateServerRole, validateScopes, authorizeResolver } = require( `${appRoot}/modules/shared` )
const { authStrategies } = require( '../../index' )

module.exports = {
  Query: {

    async app( parent, args, context, info ) {

      let app = await getApp( { id: args.id } )
      return app

    },

    async apps( parent, args, context, info ) {

      // TODO: Get all public server apps

    }

  },

  ServerApp: {

    secret( parent, args, context, info ) {

      if ( context.auth && parent.author && parent.author.id && parent.author.id === context.userId )
        return parent.secret

      return 'App secrets are only revealed to their author 😉'

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

      let { id } = await createApp( { ...args.app, authorId: context.userId } )
      return id

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
