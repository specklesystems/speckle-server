
const { authorizeResolver, pubsub } = require( `${appRoot}/modules/shared` )

module.exports = {
  Query: {},
  Mutation:{
    async userCommentActivityBroadcast( parent, args, context, info ) {
      console.log( args )
      await authorizeResolver( context.userId, args.streamId, 'stream:contributor' )
      await pubsub.publish( 'COMMENT_ACTIVITY', {
        data: args.data, 
        streamId: args.streamId,
        resourceId: args.resourceId
      } )
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