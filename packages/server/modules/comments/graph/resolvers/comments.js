const appRoot = require( 'app-root-path' )
const { authorizeResolver, pubsub } = require( `${appRoot}/modules/shared` )
const { ForbiddenError, UserInputError, ApolloError, withFilter } = require( 'apollo-server-express' )
const {  getStream } = require( '../../../core/services/streams' )

module.exports = {
  Query: {},
  Mutation:{
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
    }
  },
  Subscription:{
    userCommentActivity: {
      subscribe: withFilter( () => pubsub.asyncIterator( [ 'COMMENT_ACTIVITY' ] ), async( payload, variables, context ) => {
        await authorizeResolver( context.userId, payload.streamId, 'stream:reviewer' )
        return payload.streamId === variables.streamId && payload.resourceId === variables.resourceId
      } )
    }
  }
}