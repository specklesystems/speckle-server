const appRoot = require( 'app-root-path' )
const { authorizeResolver, pubsub } = require( `${appRoot}/modules/shared` )
const { ForbiddenError, UserInputError, ApolloError, withFilter } = require( 'apollo-server-express' )
const {  getStream } = require( `${appRoot}/modules/core/services/streams` )

const { getComment, getComments, createComment, archiveComment } = require( `${appRoot}/modules/comments/services` )

const authorizeStreamAccess = async ( { streamId, userId, auth } ) => {
  const stream = await getStream( { streamId, userId } )
  if ( !stream )
    throw new ApolloError( 'Stream not found' )

  if ( !stream.isPublic && auth === false )
    throw new ForbiddenError( 'You are not authorized.' )

  if ( !stream.isPublic ) {
    await authorizeResolver( userId, streamId, 'stream:reviewer' )
  }
}

module.exports = {  
  Query: {
    async comment( parent, args, context, info ) {
      await authorizeStreamAccess( {  streamId: args.streamId, userId: context.userId, auth: context.auth } )
      return await getComment( args.id )
    },

    async comments( parent, args, context, info ) {
      await authorizeStreamAccess( {  streamId: args.streamId, userId: context.userId, auth: context.auth } )
      return await getComments( args ) 
    }
  },
  Comment: {
    async replies( parent, args, context, info ) {
      const streamId = parent.resources.filter( r => r.resourceType === 'stream' )[0].resourceId
      const resources = [ { resourceId: parent.id, resourceType: 'comment' } ]
      return await getComments( { streamId, resources, limit: args.limit, cursor: args.cursor } )
    }
  },
  Mutation: {
    // Used for broadcasting real time chat head bubbles and status. Does not persist anything!
    async userViewerActivityBroadcast( parent, args, context, info ) {
      await authorizeStreamAccess( {  streamId: args.streamId, userId: context.userId, auth: context.auth } )

      await pubsub.publish( 'VIEWER_ACTIVITY', {
        userViewerActivity: args.data, 
        streamId: args.streamId,
        resourceId: args.resourceId
      } )
      return true
    },

    async commentCreate( parent, args, context, info ) {
      // TODO: check perms, persist comment
      await authorizeResolver( context.userId, args.input.streamId, 'stream:reviewer' )
      let id = await createComment( { userId: context.userId, input: args.input } )
      // console.log( args.input )
      await pubsub.publish( 'COMMENT_ACTIVITY', {
        commentActivity: { ...args.input, authorId: context.userId, id, createdAt: Date.now(), action: 'created' },
        streamId: args.input.streamId,
        resourceId: args.input.resources[1].resourceId // TODO: hack for now
      } )
      return id
    },
    async commentEdit( parent, args, context, info ) {
      // TODO
    },
    async commentArchive( parent, args, context, info ) {
      await archiveComment( { ...args } )
      await pubsub.publish( 'COMMENT_THREAD_ACTIVITY', {
        commentThreadActivity: { eventType: 'comment-archived' }, 
        streamId: args.streamId,
        commentId: args.commentId
      } )
      return true 
    },
    async commentReply( parent, args, context, info ) {
      // TODO
      await authorizeResolver( context.userId, args.input.streamId, 'stream:reviewer' )
      // the reply also has to be linked to the stream, for the recursive reply lookup to work
      let input = { ...args.input, resources: [ 
        { resourceId: args.input.parentComment, resourceType: 'comment' },
        { resourceId: args.input.streamId, resourceType: 'stream' }
      ] }
      // console.log(input.resources)
      let id = await createComment( { userId: context.userId, input } )
      await pubsub.publish( 'COMMENT_THREAD_ACTIVITY', {
        commentThreadActivity: { eventType: 'reply-added', ...args.input, id, authorId: context.userId, createdAt: Date.now() }, 
        streamId: args.input.streamId,
        commentId: args.input.parentComment
      } )
      return id
    }
  },
  Subscription:{
    userViewerActivity: {
      subscribe: withFilter( () => pubsub.asyncIterator( [ 'VIEWER_ACTIVITY' ] ), async( payload, variables, context ) => {
        await authorizeResolver( context.userId, payload.streamId, 'stream:reviewer' )
        return payload.streamId === variables.streamId && payload.resourceId === variables.resourceId
      } )
    },
    commentActivity: {
      subscribe: withFilter( () => pubsub.asyncIterator( [ 'COMMENT_ACTIVITY' ] ), async( payload, variables, context ) => {
        await authorizeResolver( context.userId, payload.streamId, 'stream:reviewer' )
        return payload.streamId === variables.streamId && payload.resourceId === variables.resourceId
      } )
    },
    commentThreadActivity: {
      subscribe: withFilter( () => pubsub.asyncIterator( [ 'COMMENT_THREAD_ACTIVITY' ] ), async( payload, variables, context ) => {
        await authorizeResolver( context.userId, payload.streamId, 'stream:reviewer' )
        return payload.streamId === variables.streamId && payload.commentId === variables.commentId
      } )
    }
  }
}