'use strict'

const root = require( 'app-root-path' )
const { AuthorizationError, ApolloError } = require( 'apollo-server-express' )
const { createToken, revokeToken, revokeTokenById, validateToken, getUserTokens } = require( '../../services/tokens' )
const { validateServerRole, validateScopes, authorizeResolver } = require( `${root}/modules/shared` )

module.exports = {
  Query: {},
  User: {
    async apiTokens( parent, args, context, info ) {
      // TODO!
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'tokens:read' )
      if ( parent.id !== context.userId ) throw new AuthorizationError( 'You can only view your own tokens' )

      let tokens = await getUserTokens( context.userId )
      return tokens
    }
  },
  Mutation: {
    async apiTokenCreate( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'tokens:write' )
      return await createToken( context.userId, args.name, args.scopes, args.lifespan )
    },
    async apiTokenRevoke( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'tokens:write' )
      await revokeToken( args.token.split( ' ' )[ 1 ], context.userId ) // let's not revoke other people's tokens
      return true
    }
  }
}