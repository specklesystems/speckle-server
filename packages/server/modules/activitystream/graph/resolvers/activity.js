const appRoot = require( 'app-root-path' )
const { validateServerRole, validateScopes } = require( `${appRoot}/modules/shared` )
const { ForbiddenError, UserInputError, ApolloError, withFilter } = require( 'apollo-server-express' )
const { getUserActivity, getStreamActivity, getResourceActivity, getUserTimeline } = require( '../../services/index' )


module.exports = {
  User: {
    async activity( parent, args, context, info ) {
      if ( args.limit && args.limit > 100 )
        throw new UserInputError( 'Cannot return more than 100 items; please use pagination.' )

      // TODO: cursor and total count
      let items = await getUserActivity( { userId: parent.id, timeEnd: args.timeEnd, limit: args.limit } )

      return { items }
    }
  },

  Stream: {
    async activity( parent, args, context, info ) {
    }
  },

  Branch: {
    async activity( parent, args, context, info ) {
    }
  }

}
