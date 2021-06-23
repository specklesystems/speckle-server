const appRoot = require( 'app-root-path' )
const { validateServerRole, validateScopes } = require( `${appRoot}/modules/shared` )
const { ForbiddenError, UserInputError, ApolloError, withFilter } = require( 'apollo-server-express' )
const { getUserActivity, getStreamActivity, getResourceActivity, getUserTimeline, getActivityCountByResourceId, getActivityCountByStreamId, getActivityCountByUserId } = require( '../../services/index' )


module.exports = {
  Query: {},
  User: {
    async activity( parent, args, context, info ) {
      let { items, cursor } = await getUserActivity( { userId: parent.id, actionType: args.actionType, after: args.after, before: args.before } )
      let totalCount = await getActivityCountByUserId( { userId: parent.id } )

      return { items, cursor, totalCount }
    }
  },

  Stream: {
    async activity( parent, args, context, info ) {
      let { items, cursor } = await getStreamActivity( { streamId: parent.id, actionType: args.actionType, after: args.after, before: args.before } )
      let totalCount = await getActivityCountByStreamId( { streamId: parent.id } )

      return { items, cursor, totalCount }
    }
  },

  Branch: {
    async activity( parent, args, context, info ) {
      let { items, cursor } = await getResourceActivity( { resourceType: 'branch', resourceId: parent.id, actionType: args.actionType, after: args.after, before: args.before } )
      let totalCount = await getActivityCountByResourceId( { resourceId: parent.id } )

      return { items, cursor, totalCount }
    }
  }

}
