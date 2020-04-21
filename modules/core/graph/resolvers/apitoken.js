'use strict'
const { createToken, revokeToken, revokeTokenById, validateToken, getUserTokens } = require( '../../users/services' )
module.exports = {
  Query: {},
  User: {
    async apiTokens( parent, args, context, info ) {
      return await getUserTokens( context.userId )
    }
  },
  Mutation: {
    async apiTokenCreate( parent, args, context, info ) {
      //@todo enforce token creation authorization
      return await createToken( context.userId, args.name, args.scopes, args.lifespan )
    },
    async apiTokenRevoke( parent, args, context, info ) {
      //@todo enforce token revokation authorization
      await revokeToken( args.token )
      return true
    }
  }
}