'use strict'

const root = require( 'app-root-path' )
const { AuthorizationError, ApolloError } = require( 'apollo-server-express' )
const { createToken, revokeToken, revokeTokenById, validateToken, getUserTokens } = require( '../../users/services' )
const { validateScopes, authorizeResolver } = require( `${root}/modules/shared` )

module.exports = {
  Query: {},
  User: {
    async apiTokens( parent, args, context, info ) {
   }
  },
  Mutation: {
    async apiTokenCreate( parent, args, context, info ) {
      await validateScopes( context.scopes, 'tokens:create' )
      return await createToken( context.userId, args.name, args.scopes, args.lifespan )
    },
    async apiTokenRevoke( parent, args, context, info ) {
      await validateScopes( context.scopes, 'tokens:delete' )
      await revokeToken( args.token.split( ' ' )[ 1 ], context.userId ) // let's not revoke other people's tokens
      return true
    }
  }
}