import { authorizeResolver, BranchPubsubEvents } from '@/modules/shared'
import {
  createBranchAndNotifyFactory,
  updateBranchAndNotifyFactory,
  deleteBranchAndNotifyFactory
} from '@/modules/core/services/branch/management'

import { Roles } from '@speckle/shared'
import {
  getBranchByIdFactory,
  getStreamBranchByNameFactory,
  createBranchFactory,
  updateBranchFactory,
  deleteBranchByIdFactory,
  getPaginatedStreamBranchesPageFactory,
  getStreamBranchCountFactory
} from '@/modules/core/repositories/branches'
import { db } from '@/db/knex'
import {
  addBranchCreatedActivityFactory,
  addBranchDeletedActivityFactory,
  addBranchUpdatedActivityFactory
} from '@/modules/activitystream/services/branchActivity'
import {
  getStreamFactory,
  markBranchStreamUpdatedFactory
} from '@/modules/core/repositories/streams'
import { ModelsEmitter } from '@/modules/core/events/modelsEmitter'
import { legacyGetUserFactory } from '@/modules/core/repositories/users'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getPaginatedStreamBranchesFactory } from '@/modules/core/services/branch/retrieval'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import { filteredSubscribe, publish } from '@/modules/shared/utils/subscriptions'

const markBranchStreamUpdated = markBranchStreamUpdatedFactory({ db })
const getStream = getStreamFactory({ db })
const getBranchById = getBranchByIdFactory({ db })
const getStreamBranchByName = getStreamBranchByNameFactory({ db })
const createBranchAndNotify = createBranchAndNotifyFactory({
  getStreamBranchByName,
  createBranch: createBranchFactory({ db }),
  addBranchCreatedActivity: addBranchCreatedActivityFactory({
    saveActivity: saveActivityFactory({ db }),
    publish
  })
})
const updateBranchAndNotify = updateBranchAndNotifyFactory({
  getBranchById,
  updateBranch: updateBranchFactory({ db }),
  addBranchUpdatedActivity: addBranchUpdatedActivityFactory({
    saveActivity: saveActivityFactory({ db }),
    publish
  })
})
const deleteBranchAndNotify = deleteBranchAndNotifyFactory({
  getStream,
  getBranchById: getBranchByIdFactory({ db }),
  modelsEventsEmitter: ModelsEmitter.emit,
  markBranchStreamUpdated,
  addBranchDeletedActivity: addBranchDeletedActivityFactory({
    saveActivity: saveActivityFactory({ db }),
    publish
  }),
  deleteBranchById: deleteBranchByIdFactory({ db })
})
const getUser = legacyGetUserFactory({ db })
const getPaginatedStreamBranches = getPaginatedStreamBranchesFactory({
  getPaginatedStreamBranchesPage: getPaginatedStreamBranchesPageFactory({ db }),
  getStreamBranchCount: getStreamBranchCountFactory({ db })
})

export = {
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
    async author(parent, _args, context) {
      if (parent.authorId && context.auth) return await getUser(parent.authorId)
      else return null
    }
  },
  Mutation: {
    async branchCreate(_parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.branch.streamId,
        Roles.Stream.Contributor,
        context.resourceAccessRules
      )

      const { id } = await createBranchAndNotify(args.branch, context.userId!)

      return id
    },

    async branchUpdate(_parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.branch.streamId,
        Roles.Stream.Contributor,
        context.resourceAccessRules
      )

      const newBranch = await updateBranchAndNotify(args.branch, context.userId!)
      return !!newBranch
    },

    async branchDelete(_parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.branch.streamId,
        Roles.Stream.Contributor,
        context.resourceAccessRules
      )

      const deleted = await deleteBranchAndNotify(args.branch, context.userId!)
      return deleted
    }
  },
  Subscription: {
    branchCreated: {
      subscribe: filteredSubscribe(
        BranchPubsubEvents.BranchCreated,
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
} as Resolvers
