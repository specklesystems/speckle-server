const appRoot = require( 'app-root-path' )
const { authorizeResolver, pubsub } = require( `${appRoot}/modules/shared` )
const { ForbiddenError, UserInputError, ApolloError, withFilter } = require( 'apollo-server-express' )
const {  getStream } = require( '../../../core/services/streams' )

const { createComment } = require( `${appRoot}/modules/comments/services` )

module.exports = {  
  Stream: {
    async comments( parent, args, context, info ) {
      // TODO
    },
    async comment( parent, args, context, info ) {
      // TODO
    }
  },
  Commit: {
    async comments( parent, args, context, info ) {
      // TODO
    }
  },
  Object: {
    async comments( parent, args, context, info ) {
      // TODO
    }
  },
  Comment: {
    async replies( parent, args, context, info ) {
      // TODO
    }
  },
  Mutation: {
    // Used for broadcasting real time chat head bubbles and status. Does not persist anything!
    async userCommentActivityBroadcast( parent, args, context, info ) {
      let stream = await getStream( { streamId: args.streamId, userId: context.userId } )
      if ( !stream )
        throw new ApolloError( 'Stream not found' )

      if ( !stream.isPublic && context.auth === false )
        throw new ForbiddenError( 'You are not authorized.' )

      if ( !stream.isPublic ) {
        await authorizeResolver( context.userId, args.streamId, 'stream:reviewer' )
      }

      await pubsub.publish( 'COMMENT_ACTIVITY', {
        userCommentActivity: args.data, 
        streamId: args.streamId,
        resourceId: args.resourceId
      } )
      return true
    },

    async commentCreate( parent, args, context, info ) {
      // TODO: check perms, persist comment
      // console.log( '---', args )
      await authorizeResolver( context.userId, args.input.streamId, 'stream:reviewer' )
      let id = await createComment( { userId: context.userId, input: args.input } )
      await pubsub.publish( 'COMMENT_CREATED', {
        commentCreated: args.input, 
        streamId: args.input.streamId,
        resourceId: args.input.resources[0]
      } )
      return id
    },
    async commentEdit( parent, args, context, info ) {
      // TODO
    },
    async commentReply( parent, args, context, info ) {
      // TODO
      await pubsub.publish( 'COMMENT_REPLY_CREATED', {
        commentCreated: args.input, 
        streamId: args.streamId,
        resourceId: args.resourceId
      } )
      return true
    },
    async commentReplyEdit( parent, args, context, info ) {
      // TODO
    },
  },
  Subscription:{
    userCommentActivity: {
      subscribe: withFilter( () => pubsub.asyncIterator( [ 'COMMENT_ACTIVITY' ] ), async( payload, variables, context ) => {
        await authorizeResolver( context.userId, payload.streamId, 'stream:reviewer' )
        return payload.streamId === variables.streamId && payload.resourceId === variables.resourceId
      } )
    },
    commentCreated: {
      subscribe: withFilter( () => pubsub.asyncIterator( [ 'COMMENT_CREATED' ] ), async( payload, variables, context ) => {
        await authorizeResolver( context.userId, payload.streamId, 'stream:reviewer' )
        return payload.streamId === variables.streamId && payload.resourceId === variables.resourceId
      } )
    },
    commentReplyCreated: {
      subscribe: withFilter( () => pubsub.asyncIterator( [ 'COMMENT_REPLY_CREATED' ] ), async( payload, variables, context ) => {
        await authorizeResolver( context.userId, payload.streamId, 'stream:reviewer' )
        return payload.streamId === variables.streamId && payload.resourceId === variables.resourceId
      } )
    }
  }
}