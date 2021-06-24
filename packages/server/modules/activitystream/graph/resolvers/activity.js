const { getUserActivity, getStreamActivity, getResourceActivity, getUserTimeline, getActivityCountByResourceId, getActivityCountByStreamId, getActivityCountByUserId, getTimelineCount } = require( '../../services/index' )


module.exports = {
  Query: {},
  User: {
    async activity( parent, args, context, info ) {
      let { items, cursor } = await getUserActivity( { userId: parent.id, actionType: args.actionType, after: args.after, before: args.before, limit: args.limit } )
      let totalCount = await getActivityCountByUserId( { userId: parent.id } )

      return { items, cursor, totalCount }
    },

    async timeline( parent, args, context, info ) {
      let { items, cursor } = await getUserTimeline( { userId: parent.id, after: args.after, before: args.before, limit: args.limit } )
      let totalCount = await getTimelineCount( { userId: parent.id } )

      return { items, cursor, totalCount }
    }
  },

  Stream: {
    async activity( parent, args, context, info ) {
      let { items, cursor } = await getStreamActivity( { streamId: parent.id, actionType: args.actionType, after: args.after, before: args.before, limit: args.limit } )
      let totalCount = await getActivityCountByStreamId( { streamId: parent.id } )

      return { items, cursor, totalCount }
    }
  },

  Branch: {
    async activity( parent, args, context, info ) {
      let { items, cursor } = await getResourceActivity( { resourceType: 'branch', resourceId: parent.id, actionType: args.actionType, after: args.after, before: args.before, limit: args.limit } )
      let totalCount = await getActivityCountByResourceId( { resourceId: parent.id } )

      return { items, cursor, totalCount }
    }
  }

}
