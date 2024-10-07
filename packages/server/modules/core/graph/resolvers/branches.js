'use strict'

const { withFilter } = require('graphql-subscriptions')

const {
  pubsub,
  BranchSubscriptions: BranchPubsubEvents
} = require('@/modules/shared/utils/subscriptions')
const { authorizeResolver } = require('@/modules/shared')

const {
  createBranchAndNotifyFactory,
  updateBranchAndNotifyFactory,
  deleteBranchAndNotifyFactory
} = require('@/modules/core/services/branch/management')
const {
  getPaginatedStreamBranches
} = require('@/modules/core/services/branch/retrieval')

const { getUserById } = require('../../services/users')
const { Roles } = require('@speckle/shared')
const {
  getBranchByIdFactory,
  getStreamBranchByNameFactory,
  createBranchFactory,
  updateBranchFactory,
  deleteBranchByIdFactory
} = require('@/modules/core/repositories/branches')
const { db } = require('@/db/knex')
const {
  addBranchCreatedActivity,
  addBranchUpdatedActivity,
  addBranchDeletedActivity
} = require('@/modules/activitystream/services/branchActivity')
const {
  getStream,
  markBranchStreamUpdated
} = require('@/modules/core/repositories/streams')
const { ModelsEmitter } = require('@/modules/core/events/modelsEmitter')

// subscription events
const BRANCH_CREATED = BranchPubsubEvents.BranchCreated
const BRANCH_UPDATED = BranchPubsubEvents.BranchUpdated
const BRANCH_DELETED = BranchPubsubEvents.BranchDeleted

const getBranchById = getBranchByIdFactory({ db })
const getStreamBranchByName = getStreamBranchByNameFactory({ db })
const createBranchAndNotify = createBranchAndNotifyFactory({
  getStreamBranchByName,
  createBranch: createBranchFactory({ db }),
  addBranchCreatedActivity
})
const updateBranchAndNotify = updateBranchAndNotifyFactory({
  getBranchById,
  updateBranch: updateBranchFactory({ db }),
  addBranchUpdatedActivity
})
const deleteBranchAndNotify = deleteBranchAndNotifyFactory({
  getStream,
  getBranchById: getBranchByIdFactory({ db }),
  modelsEventsEmitter: ModelsEmitter.emit,
  markBranchStreamUpdated,
  addBranchDeletedActivity,
  deleteBranchById: deleteBranchByIdFactory({ db })
})

/** @type {import('@/modules/core/graph/generated/graphql').Resolvers} */
module.exports = {
  Query: {},
  Stream: {
    async branches(parent, args) {
      return await getPaginatedStreamBranches(parent.id, args)
    },

    async branch(parent, args) {
      // TODO: TEMPORARY HACK
      // Temporary "Forwards" compatibility layer to allow .NET and PY clients
      // to use FE2 urls without major changes.
      // When getting a branch by name, if not found, we try to do a 'hail mary' attempt
      // and get it by id as well (this would be coming from a FE2 url).

      const branchByName = await getStreamBranchByName(parent.id, args.name)
      if (branchByName) return branchByName

      const branchByIdRes = await getBranchById(args.name)
      if (!branchByIdRes) return null

      // Extra validation to check if it actually belongs to the stream
      if (branchByIdRes.streamId !== parent.id) return null
      return branchByIdRes
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
        Roles.Stream.Contributor,
        context.resourceAccessRules
      )

      const { id } = await createBranchAndNotify(args.branch, context.userId)

      return id
    },

    async branchUpdate(parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.branch.streamId,
        Roles.Stream.Contributor,
        context.resourceAccessRules
      )

      const newBranch = await updateBranchAndNotify(args.branch, context.userId)
      return !!newBranch
    },

    async branchDelete(parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.branch.streamId,
        Roles.Stream.Contributor,
        context.resourceAccessRules
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
          await authorizeResolver(
            context.userId,
            payload.streamId,
            Roles.Stream.Reviewer,
            context.resourceAccessRules
          )

          return payload.streamId === variables.streamId
        }
      )
    },

    branchUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([BRANCH_UPDATED]),
        async (payload, variables, context) => {
          await authorizeResolver(
            context.userId,
            payload.streamId,
            Roles.Stream.Reviewer,
            context.resourceAccessRules
          )

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
