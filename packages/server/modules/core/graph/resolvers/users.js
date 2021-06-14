'use strict'
const appRoot = require( 'app-root-path' )
const { ApolloError, ForbiddenError, UserInputError } = require( 'apollo-server-express' )
const { createUser, getUser, getUserByEmail, getUserRole, updateUser, deleteUser, searchUsers, validatePasssword } = require( '../../services/users' )
const { createPersonalAccessToken, createAppToken, revokeToken, revokeTokenById, validateToken, getUserTokens } = require( '../../services/tokens' )
const { validateServerRole, validateScopes, authorizeResolver } = require( `${appRoot}/modules/shared` )
const zxcvbn = require( 'zxcvbn' )

module.exports = {
  Query: {

    async _() {
      return `Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn.`
    },

    async user( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )

      if ( !args.id )
        await validateScopes( context.scopes, 'profile:read' )
      else
        await validateScopes( context.scopes, 'users:read' )

      if ( !args.id && !context.userId ) {
        throw new UserInputError( 'You must provide an user id.' )
      }

      return await getUser( args.id || context.userId )
    },

    async userSearch( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'profile:read' )
      await validateScopes( context.scopes, 'users:read' )

      if ( args.query.length < 3 )
        throw new UserInputError( 'Search query must be at least 3 carachters.' )


      if ( args.limit  && args.limit > 100 )
        throw new UserInputError( 'Cannot return more than 100 items, please use pagination.' )

      let { cursor, users } = await searchUsers( args.query, args.limit, args.cursor )
      return { cursor: cursor, items: users }
    },

    async userPwdStrength( parent, args, context, info ) {
      let res = zxcvbn( args.pwd )
      return { score: res.score, feedback: res.feedback }
    }

  },

  User: {

    async email( parent, args, context, info ) {
      // NOTE: we're redacting the field (returning null) rather than throwing a full error which would invalidate the request.
      if ( context.userId === parent.id ) {
        try {
          await validateScopes( context.scopes, 'profile:email' )
          return parent.email
        } catch ( err ) {
          return null
        }
      }

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
    async userUpdate( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await updateUser( context.userId, args.user )
      return true
    },

    async userDelete( parent, args, context, info ) {
      let user = await getUser( context.userId )

      if ( args.userConfirmation.email !== user.email ) {
        throw new UserInputError( 'Malformed input: emails do not match.' )
      }

      // The below are not really needed anymore as we've added the hasRole and hasScope
      // directives in the graphql schema itself. 
      // Since I am paranoid, I'll leave them here too. 
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'profile:delete' )

      await deleteUser( context.userId, args.user )
      return true
    }
  }
}
