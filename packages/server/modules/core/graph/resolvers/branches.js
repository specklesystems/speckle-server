'use strict'

const { withFilter } = require('graphql-subscriptions')

const { authorizeResolver, pubsub, BranchPubsubEvents } = require('@/modules/shared')

const { getBranchByNameAndStreamId } = require('../../services/branches')
const {
  createBranchAndNotify,
  updateBranchAndNotify,
  deleteBranchAndNotify
} = require('@/modules/core/services/branch/management')
const {
  getPaginatedStreamBranches
} = require('@/modules/core/services/branch/retrieval')

const { getUserById } = require('../../services/users')

// subscription events
const BRANCH_CREATED = BranchPubsubEvents.BranchCreated
const BRANCH_UPDATED = BranchPubsubEvents.BranchUpdated
const BRANCH_DELETED = BranchPubsubEvents.BranchDeleted

/** @type {import('@/modules/core/graph/generated/graphql').Resolvers} */
module.exports = {
  Query: {},
  Stream: {
    async branches(parent, args) {
      return await getPaginatedStreamBranches(parent.id, args)
    },

    async branch(parent, args) {
      return await getBranchByNameAndStreamId({ streamId: parent.id, name: args.name })
    }
  },
  Branch: {
    async author(parent, args, context) {
      if (parent.authorId && context.auth)
        return await getUserById({ userId: parent.authorId })
      else return null
    }
  },
  Mutation: {
    async branchCreate(parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.branch.streamId,
        'stream:contributor'
      )

      const { id } = await createBranchAndNotify(args.branch, context.userId)

      return id
    },

    async branchUpdate(parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.branch.streamId,
        'stream:contributor'
      )

      const newBranch = await updateBranchAndNotify(args.branch, context.userId)
      return !!newBranch
    },

    async branchDelete(parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.branch.streamId,
        'stream:contributor'
      )

      const deleted = await deleteBranchAndNotify(args.branch, context.userId)
      return deleted
    }
  },
  Subscription: {
    branchCreated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([BRANCH_CREATED]),
        async (payload, variables, context) => {
          await authorizeResolver(context.userId, payload.streamId, 'stream:reviewer')

          return payload.streamId === variables.streamId
        }
      )
    },

    branchUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([BRANCH_UPDATED]),
        async (payload, variables, context) => {
          await authorizeResolver(context.userId, payload.streamId, 'stream:reviewer')

          const streamMatch = payload.streamId === variables.streamId
          if (streamMatch && variables.branchId) {
            return payload.branchId === variables.branchId
          }

          return streamMatch
        }
      )
    },

    branchDeleted: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([BRANCH_DELETED]),
        async (payload, variables, context) => {
          await authorizeResolver(context.userId, payload.streamId, 'stream:reviewer')

          return payload.streamId === variables.streamId
        }
      )
    }
  }
}
