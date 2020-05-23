'use strict'
const root = require( 'app-root-path' )
const { AuthenticationError, UserInputError } = require( 'apollo-server-express' )
const { createUser, getUser, getUserRole, updateUser, deleteUser, validatePasssword, createToken, revokeToken, revokeTokenById, validateToken, getUserTokens } = require( '../../services/users' )
const { validateServerRole, validateScopes, authorizeResolver } = require( `${root}/modules/shared` )

module.exports = {
  Query: {
    async user( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'users:read' )

      if ( !args.id && !context.userId ) {
        throw new UserInputError( 'You must provide an user id.' )
      }

      return await getUser( args.id || context.userId )
    }
  },
  User: {
    async email( parent, args, context, info ) {
      // if it's me, go ahead
      if ( context.userId === parent.id )
        return parent.email

      // otherwise check scopes
      try {
        await validateScopes( context.scopes, 'users:email' )
        return parent.email
      } catch ( err ) {
        return null
      }
    },
    async role( parent, args, context, info ) {
      return await getUserRole( parent.id )
    }
  },
  Mutation: {
    async userEdit( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await updateUser( context.userId, args.user )
      return true
    },
  }
}