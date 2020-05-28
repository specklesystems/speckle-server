'use strict'
const root = require( 'app-root-path' )
const { validateServerRole, validateScopes, authorizeResolver } = require( `${root}/modules/shared` )
const { getAvailableScopes, getAvailableRoles, getServerName, getServerDescription, getAdminContact, getTOS } = require( '../../services/generic' )

module.exports = {
  Query: {
    async serverInfo( parent, args, context, info ) {
      let si = {
        name: await getServerName( ),
        description: await getServerDescription( ),
        adminContact: await getAdminContact( ),
        tos: await getTOS( )
      }

      return si
    }
  },
  ServerInfo: {
    async roles( parent, args, context, info ) {
      return await getAvailableRoles( )
    },
    async scopes( parent, args, context, info ) {
      return await getAvailableScopes( )
    }
  },
  Mutation: {
    async serverInfoUpdate( parent, args, context, info ) {
      console.log( context )
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'server:setup' )
      // TODO
      return false
    }
  }
}