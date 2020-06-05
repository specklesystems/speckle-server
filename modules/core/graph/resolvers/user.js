'use strict'
const root = require( 'app-root-path' )
const { ApolloError, AuthenticationError, UserInputError } = require( 'apollo-server-express' )
const { createUser, getUser, getUserByEmail, getUserRole, updateUser, deleteUser, validatePasssword } = require( '../../services/users' )
const { createPersonalAccessToken, createAppToken, revokeToken, revokeTokenById, validateToken, getUserTokens } = require( '../../services/tokens' )
const { validateServerRole, validateScopes, authorizeResolver } = require( `${root}/modules/shared` )
const setupCheck = require( `${root}/setupcheck` )
const zxcvbn = require( 'zxcvbn' )
module.exports = {
  Query: {
    async _( ) {
      return `Ph'nglui mglw'nafh Cthulhu R'lyeh wgah'nagl fhtagn.`
    },
    async user( parent, args, context, info ) {
      await validateServerRole( context, 'server:user' )
      await validateScopes( context.scopes, 'users:read' )

      if ( !args.id && !context.userId ) {
        throw new UserInputError( 'You must provide an user id.' )
      }

      return await getUser( args.id || context.userId )
    },
    async userPwdStrength( parent, args, context, info ) {
      let res = zxcvbn( args.pwd )
      return { score: res.score, feedback: res.feedback }
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
    async userLogin( parent, args, context, info ) {
      if ( process.env.STRATEGY_LOCAL !== 'true' )
        throw new ApolloError( 'Registration method not available' )
      try {
        let res = await validatePasssword( { email: args.email, password: args.password } )
        let { id: userId } = await getUserByEmail( { email: args.email } )
        let token = await createAppToken( { userId, appId: 'spklwebapp' } )
        return token
      } catch ( err ) {
        throw new Error( 'Login failed' + err.message )
      }
    },
    async userCreate( parent, args, context, info ) {
      let setupComplete = await setupCheck( )
      if ( setupComplete && process.env.STRATEGY_LOCAL !== 'true' )
        throw new ApolloError( 'Registration method not available' )

      if ( zxcvbn( args.user.password ).score < 3 ) throw new ApolloError( `Password too weak` )

      let userId = await createUser( args.user )
      return true
    },
    async userCreateAdmin( parent, args, context, info ) {
      let setupComplete = await setupCheck( )
      if ( setupComplete ) throw new ApolloError( 'Registration method not available' )

      let userId = await createUser( args.user )
      let token = await createPersonalAccessToken( userId, "Default Token", [ 'server:setup', 'profile:read', 'profile:email', 'users:read', 'users:email' ] )

      return token
    }
  }
}