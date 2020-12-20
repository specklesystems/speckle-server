'use strict'

const appRoot = require( 'app-root-path' )
const { ForbiddenError, ApolloError } = require( 'apollo-server-express' )
const { createPersonalAccessToken, revokeToken, revokeTokenById, validateToken, getUserTokens } = require( '../../services/tokens' )

module.exports = {
  Query: {},
  User: {
    async apiTokens( parent, args, context, info ) {
      // TODO!
      if ( parent.id !== context.userId ) throw new ForbiddenError( 'You can only view your own tokens' )

      let tokens = await getUserTokens( context.userId )
      return tokens
    }
  },
  Mutation: {
    async apiTokenCreate( parent, args, context, info ) {
      return await createPersonalAccessToken( context.userId, args.token.name, args.token.scopes, args.token.lifespan )
    },
    async apiTokenRevoke( parent, args, context, info ) {
      let id = null
      if ( args.token.toLowerCase().includes( "bearer" ) )
        id = args.token.split( ' ' )[ 1 ]
      else
        id = args.token
      await revokeToken( id, context.userId ) // let's not revoke other people's tokens
      return true
    }
  }
}
