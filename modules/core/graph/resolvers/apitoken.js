'use strict'
const { createToken, revokeToken, revokeTokenById, validateToken, getUserTokens } = require( '../../users/services' )
module.exports = {
  Query: {},
  User: {
    async apiTokens( parent, args, context, info ) {
      return await getUserTokens( context.userId )
    }
  }
}