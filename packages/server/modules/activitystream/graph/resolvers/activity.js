'use strict'
const appRoot = require( 'app-root-path' )
const { ApolloError, ForbiddenError, UserInputError, withFilter } = require( 'apollo-server-express' )

const { getUserActivity, getStreamActivity, getResourceActivity, getUserTimeline, getActivityCountByResourceId, getActivityCountByStreamId, getActivityCountByUserId, getTimelineCount } = require( '../../services/index' )

const { authorizeResolver, validateScopes } = require( `${appRoot}/modules/shared` )
const { saveActivity } = require( `${appRoot}/modules/activitystream/services` )

const { getStream } = require( `${appRoot}/modules/core/services/streams` )

module.exports = {
  Query: {},
  User: {
    async activity( parent, args, context, info ) {
      let { items, cursor } = await getUserActivity( { userId: parent.id, actionType: args.actionType, after: args.after, before: args.before, cursor: args.cursor, limit: args.limit } )
      let totalCount = await getActivityCountByUserId( { userId: parent.id, actionType: args.actionType, after: args.after, before: args.before } )

      return { items, cursor, totalCount }
    },

    async timeline( parent, args, context, info ) {
      let { items, cursor } = await getUserTimeline( { userId: parent.id, after: args.after, before: args.before, cursor: args.cursor, limit: args.limit } )
      let totalCount = await getTimelineCount( { userId: parent.id, after: args.after, before: args.before } )

      return { items, cursor, totalCount }
    }
  },

  Stream: {
    async activity( parent, args, context, info ) {
      let { items, cursor } = await getStreamActivity( { streamId: parent.id, actionType: args.actionType, after: args.after, before: args.before, cursor: args.cursor, limit: args.limit } )
      let totalCount = await getActivityCountByStreamId( { streamId: parent.id, actionType: args.actionType, after: args.after, before: args.before } )

      return { items, cursor, totalCount }
    }
  },

  Branch: {
    async activity( parent, args, context, info ) {
      let { items, cursor } = await getResourceActivity( { resourceType: 'branch', resourceId: parent.id, actionType: args.actionType, after: args.after, before: args.before, cursor: args.cursor, limit: args.limit } )
      let totalCount = await getActivityCountByResourceId( { resourceId: parent.id, actionType: args.actionType, after: args.after, before: args.before } )

      return { items, cursor, totalCount }
    }
  },

  Commit: {
    async activity( parent, args, context, info ) {
      let { items, cursor } = await getResourceActivity( { resourceType: 'commit', resourceId: parent.id, actionType: args.actionType, after: args.after, before: args.before, cursor: args.cursor, limit: args.limit } )
      let totalCount = await getActivityCountByResourceId( { resourceId: parent.id, actionType: args.actionType, after: args.after, before: args.before } )

      return { items, cursor, totalCount }
    }
  }

}
