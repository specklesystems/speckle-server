const { withFilter } = require('graphql-subscriptions')
const {
  pubsub,
  CommitSubscriptions: CommitPubsubEvents
} = require('@/modules/shared/utils/subscriptions')
const { authorizeResolver } = require('@/modules/shared')
const { Roles } = require('@speckle/shared')

/**
 * TODO: Clean up and move to commitsNew.ts
 */

// subscription events
const COMMIT_DELETED = CommitPubsubEvents.CommitDeleted

/** @type {import('@/modules/core/graph/generated/graphql').Resolvers} */
module.exports = {
  Subscription: {
    commitDeleted: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([COMMIT_DELETED]),
        async (payload, variables, context) => {
          await authorizeResolver(
            context.userId,
            payload.streamId,
            Roles.Stream.Reviewer,
            context.resourceAccessRules
          )

          return payload.streamId === variables.streamId
        }
      )
    }
  }
}
