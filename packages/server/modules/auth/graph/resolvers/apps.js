'use strict'
const appRoot = require( 'app-root-path' )
const { ForbiddenError, ApolloError } = require( 'apollo-server-express' )

const {
  getApp,
  getAllPublicApps,
  getAllAppsCreatedByUser,
  getAllAppsAuthorizedByUser,
  createApp,
  updateApp,
  deleteApp,
  revokeExistingAppCredentialsForUser,
  createAuthorizationCode,
  exchangeAuthorizationCodeForToken
} = require( '../../services/apps' )
const { createAppToken } = require( `${appRoot}/modules/core/services/tokens` )
const { validateServerRole, validateScopes, authorizeResolver } = require( `${appRoot}/modules/shared` )

module.exports = {
  Query: {

    async app( parent, args, context, info ) {
      let app = await getApp( { id: args.id } )
      return app
    },

    async apps( parent, args, context, info ) {
      return await getAllPublicApps( )
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
      let res = await getAllAppsAuthorizedByUser( { userId: context.userId } )
      return res
    },
    async createdApps( parent, args, context, info ) {
      return await getAllAppsCreatedByUser( { userId: context.userId } )
    }
  },
  Mutation: {

    async appCreate( parent, args, context, info ) {
      let { id } = await createApp( { ...args.app, authorId: context.userId } )
      return id
    },

    async appUpdate( parent, args, context, info ) {
      let app = await getApp( { id: args.app.id } )
      if ( !app.author && context.role !== 'server:admin' ) throw new ForbiddenError( 'You are not authorized to edit this app.' )
      if ( app.author.id !== context.userId && context.role !== 'server:admin' ) throw new ForbiddenError( 'You are not authorized to edit this app.' )

      await updateApp( { app: args.app } )
      return true
    },

    async appDelete( parent, args, context, info ) {
      let app = await getApp( { id: args.appId } )

      if ( !app.author && context.role !== 'server:admin' ) throw new ForbiddenError( 'You are not authorized to edit this app.' )
      if ( app.author.id !== context.userId && context.role !== 'server:admin' ) throw new ForbiddenError( 'You are not authorized to edit this app.' )

      return ( await deleteApp( { id: args.appId } ) ) === 1
    },

    async appRevokeAccess( parent, args, context, info ) {
      return await revokeExistingAppCredentialsForUser( { appId: args.appId, userId: context.userId } )
    }
  }
}
