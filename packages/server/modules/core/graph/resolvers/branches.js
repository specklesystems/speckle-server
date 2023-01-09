'use strict'

const { ForbiddenError, ApolloError } = require('apollo-server-express')
const { withFilter } = require('graphql-subscriptions')

const { authorizeResolver, pubsub, BranchPubsubEvents } = require('@/modules/shared')

const {
  updateBranch,
  getBranchById,
  getBranchByNameAndStreamId,
  deleteBranchById
} = require('../../services/branches')
const { createBranchAndNotify } = require('@/modules/core/services/branch/management')
const {
  getPaginatedStreamBranches
} = require('@/modules/core/services/branch/retrieval')

const { getUserById } = require('../../services/users')
const { saveActivity } = require('@/modules/activitystream/services')
const { ActionTypes } = require('@/modules/activitystream/helpers/types')

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

      const oldValue = await getBranchById({ id: args.branch.id })
      if (!oldValue) {
        throw new ApolloError('Branch not found.')
      }

      if (oldValue.streamId !== args.branch.streamId)
        throw new ForbiddenError(
          'The branch id and stream id do not match. Please check your inputs.'
        )

      const updated = await updateBranch({ ...args.branch })

      if (updated) {
        await saveActivity({
          streamId: args.branch.streamId,
          resourceType: 'branch',
          resourceId: args.branch.id,
          actionType: ActionTypes.Branch.Update,
          userId: context.userId,
          info: { old: oldValue, new: args.branch },
          message: `Branch metadata changed: '${args.branch.name}' (${args.branch.id})`
        })
        await pubsub.publish(BRANCH_UPDATED, {
          branchUpdated: { ...args.branch },
          streamId: args.branch.streamId,
          branchId: args.branch.id
        })
      }

      return updated
    },

    async branchDelete(parent, args, context) {
      const role = await authorizeResolver(
        context.userId,
        args.branch.streamId,
        'stream:contributor'
      )

      const branch = await getBranchById({ id: args.branch.id })
      if (!branch) {
        throw new ApolloError('Branch not found.')
      }

      if (branch.streamId !== args.branch.streamId)
        throw new ForbiddenError(
          'The branch id and stream id do not match. Please check your inputs.'
        )

      if (branch.authorId !== context.userId && role !== 'stream:owner')
        throw new ForbiddenError(
          'Only the branch creator or stream owners are allowed to delete branches.'
        )

      const deleted = await deleteBranchById({
        id: args.branch.id,
        streamId: args.branch.streamId
      })
      if (deleted) {
        await saveActivity({
          streamId: args.branch.streamId,
          resourceType: 'branch',
          resourceId: args.branch.id,
          actionType: ActionTypes.Branch.Delete,
          userId: context.userId,
          info: { branch: { ...args.branch, name: branch.name } },
          message: `Branch deleted: '${branch.name}' (${args.branch.id})`
        })
        await pubsub.publish(BRANCH_DELETED, {
          branchDeleted: { ...args.branch },
          streamId: args.branch.streamId
        })
      }

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
