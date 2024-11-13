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
import { getProjectDbClient } from '@/modules/multiregion/dbSelector'

export = {
  Query: {},
  Stream: {
    async branches(parent, args) {
      const projectDB = await getProjectDbClient({ projectId: parent.id })
      const getPaginatedStreamBranches = getPaginatedStreamBranchesFactory({
        getPaginatedStreamBranchesPage: getPaginatedStreamBranchesPageFactory({
          db: projectDB
        }),
        getStreamBranchCount: getStreamBranchCountFactory({ db: projectDB })
      })
      return await getPaginatedStreamBranches(parent.id, args)
    },

    async branch(parent, args) {
      // TODO: TEMPORARY HACK
      // Temporary "Forwards" compatibility layer to allow .NET and PY clients
      // to use FE2 urls without major changes.
      // When getting a branch by name, if not found, we try to do a 'hail mary' attempt
      // and get it by id as well (this would be coming from a FE2 url).

      const projectDB = await getProjectDbClient({ projectId: parent.id })
      const getStreamBranchByName = getStreamBranchByNameFactory({ db: projectDB })
      const branchByName = await getStreamBranchByName(parent.id, args.name)
      if (branchByName) return branchByName

      const getBranchById = getBranchByIdFactory({ db: projectDB })
      const branchByIdRes = await getBranchById(args.name)
      if (!branchByIdRes) return null

      // Extra validation to check if it actually belongs to the stream
      if (branchByIdRes.streamId !== parent.id) return null
      return branchByIdRes
    }
  },
  Branch: {
    async author(parent, _args, context) {
      const getUser = legacyGetUserFactory({ db })
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

      const projectDB = await getProjectDbClient({ projectId: args.branch.streamId })
      const getStreamBranchByName = getStreamBranchByNameFactory({ db: projectDB })
      const createBranchAndNotify = createBranchAndNotifyFactory({
        getStreamBranchByName,
        createBranch: createBranchFactory({ db: projectDB }),
        addBranchCreatedActivity: addBranchCreatedActivityFactory({
          saveActivity: saveActivityFactory({ db }),
          publish
        })
      })
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

      const projectDB = await getProjectDbClient({ projectId: args.branch.streamId })
      const getBranchById = getBranchByIdFactory({ db: projectDB })
      const updateBranchAndNotify = updateBranchAndNotifyFactory({
        getBranchById,
        updateBranch: updateBranchFactory({ db: projectDB }),
        addBranchUpdatedActivity: addBranchUpdatedActivityFactory({
          saveActivity: saveActivityFactory({ db }),
          publish
        })
      })
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

      const projectDB = await getProjectDbClient({ projectId: args.branch.streamId })
      const markBranchStreamUpdated = markBranchStreamUpdatedFactory({ db: projectDB })
      const getStream = getStreamFactory({ db: projectDB })
      const deleteBranchAndNotify = deleteBranchAndNotifyFactory({
        getStream,
        getBranchById: getBranchByIdFactory({ db: projectDB }),
        modelsEventsEmitter: ModelsEmitter.emit,
        markBranchStreamUpdated,
        addBranchDeletedActivity: addBranchDeletedActivityFactory({
          saveActivity: saveActivityFactory({ db }),
          publish
        }),
        deleteBranchById: deleteBranchByIdFactory({ db: projectDB })
      })
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
    },
    branchUpdated: {
      subscribe: filteredSubscribe(
        BranchPubsubEvents.BranchUpdated,
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
      subscribe: filteredSubscribe(
        BranchPubsubEvents.BranchDeleted,
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
