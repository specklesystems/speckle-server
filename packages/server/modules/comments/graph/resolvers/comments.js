const appRoot = require( 'app-root-path' )
const { authorizeResolver, pubsub } = require( `${appRoot}/modules/shared` )
const { ForbiddenError, UserInputError, ApolloError, withFilter } = require( 'apollo-server-express' )
const {  getStream } = require( `${appRoot}/modules/core/services/streams` )

const { getComment, getComments, createComment } = require( `${appRoot}/modules/comments/services` )

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
      // TODO
    }
  },
  Mutation: {
    // Used for broadcasting real time chat head bubbles and status. Does not persist anything!
    async userCommentActivityBroadcast( parent, args, context, info ) {
      await authorizeStreamAccess( {  streamId: args.streamId, userId: context.userId, auth: context.auth } )

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
      console.log( args.input )
      await pubsub.publish( 'COMMENT_CREATED', {
        commentCreated: { ...args.input, authorId: context.userId, createdAt: Date.now() },
        streamId: args.input.streamId,
        resourceId: args.input.resources[0].resourceId // TODO: hack for now
      } )
      return id
    },
    async commentEdit( parent, args, context, info ) {
      // TODO
    },
    async commentReply( parent, args, context, info ) {
      // TODO
      await authorizeResolver( context.userId, args.input.streamId, 'stream:reviewer' )
      // the reply also has to be linked to the stream, for the recursive reply lookup to work
      let input = { ...args.input, resources: [ 
        { id: args.input.parentComment, type: 'comment' },
        { id: args.input.streamId, type: 'stream' }
      ] }
      let id = await createComment( { userId: context.userId, input } )
      await pubsub.publish( 'COMMENT_REPLY_CREATED', {
        commentCreated: args.input, 
        streamId: args.streamId,
        resourceId: args.resourceId
      } )
      return id
    },
    // async commentReplyEdit( parent, args, context, info ) {
    //   // TODO
    // },
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