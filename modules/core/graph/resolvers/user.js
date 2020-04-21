'use strict'
const root = require( 'app-root-path' )
const { AuthenticationError, UserInputError } = require( 'apollo-server-express' )
const { createUser, getUser, updateUser, deleteUser, validatePasssword, createToken, revokeToken, revokeTokenById, validateToken, getUserTokens } = require( '../../users/services' )
const { validateScopes, authorizeResolver } = require( `${root}/modules/shared` )

module.exports = {
  Query: {
    async user( parent, args, context, info ) {
      if ( !context.auth ) throw new AuthenticationError( )

      if ( !args.id && !context.userId ) {
        throw new UserInputError( 'You must provide an user id.' )
      }

      return await getUser( args.id || context.userId )
    }
  },
  Mutation: {
    async userCreate( parent, args, context, info ) {
      let userId = await createUser( args.user )
      let token = await createToken( userId, "Default Token", [ 'streams:read', 'streams:write' ] )
      return token
    },
    async userEdit( parent, args, context, info ) {
      if ( context.userId !== args.user.id )
        throw new AuthenticationError( 'Not authorized' )
      
      await updateUser( context.userId, args.user )
      return true
    },
  }
}