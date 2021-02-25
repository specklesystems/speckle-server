'use strict'
const appRoot = require( 'app-root-path' )
const { validateServerRole, validateScopes, authorizeResolver } = require( `${appRoot}/modules/shared` )
const { updateServerInfo, getServerInfo, getPublicScopes, getPublicRoles } = require( '../../services/generic' )

module.exports = {
  Query: {

    async serverInfo( parent, args, context, info ) {

      return await getServerInfo()

    }

  },

  ServerInfo: {

    async roles( parent, args, context, info ) {

      return await getPublicRoles( )

    },

    async scopes( parent, args, context, info ) {

      return await getPublicScopes( )

    }
  },

  Mutation: {

    async serverInfoUpdate( parent, args, context, info ) {

      await validateServerRole( context, 'server:admin' )
      await validateScopes( context.scopes, 'server:setup' )

      await updateServerInfo( args.info )
      return true

    }

  }

}
