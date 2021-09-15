
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

  Mutation: {
    
    async commitReadReceiptCreate( parent, args, context, info ) {
      let stream = await getStream( { streamId: args.input.streamId, userId: context.userId } )
      if ( !stream )
        throw new ApolloError( 'Stream not found' )

      if ( !stream.isPublic && context.auth === false )
        throw new ForbiddenError( 'You are not authorised.' )

      if ( !stream.isPublic ) {
        await validateScopes( context.scopes, 'streams:read' )
        await authorizeResolver( context.userId, args.input.streamId, 'stream:reviewer' )
      }

      // TODO: 
      let { items, cursor } = await getResourceActivity( { resourceType: 'commit', resourceId: args.input.commitId, actionType: 'commit_receive', after: args.after, before: args.before, cursor: args.cursor, limit: args.limit } )
      let totalCount = await getActivityCountByResourceId( { resourceId: args.input.commitId, actionType: 'commit_receive', after: args.after, before: args.before } )

      await saveActivity( {
        streamId: args.input.streamId,
        resourceType: 'commit',
        resourceId: args.input.commitId,
        actionType: 'commit_receive',
        userId: context.userId,
        info: args.input,
        message: `Commit ${args.input.commitId} was received by user ${context.userId} from ${args.input.applicationName}.`
      } ) 

      return { items, cursor, totalCount }
    }
  }

}
