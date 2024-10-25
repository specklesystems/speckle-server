const { withFilter } = require('graphql-subscriptions')
const {
  pubsub,
  BranchSubscriptions: BranchPubsubEvents
} = require('@/modules/shared/utils/subscriptions')
const { authorizeResolver } = require('@/modules/shared')
const { Roles } = require('@speckle/shared')

/**
 * TODO: Clean up and move to branchesNew.ts
 */

// subscription events
const BRANCH_DELETED = BranchPubsubEvents.BranchDeleted

/** @type {import('@/modules/core/graph/generated/graphql').Resolvers} */
module.exports = {
  Subscription: {
    branchDeleted: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([BRANCH_DELETED]),
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
