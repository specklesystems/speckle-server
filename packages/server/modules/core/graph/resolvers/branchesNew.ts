import { authorizeResolver } from '@/modules/shared'
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
  addBranchCreatedActivity,
  addBranchUpdatedActivity,
  addBranchDeletedActivity
} from '@/modules/activitystream/services/branchActivity'
import {
  getStreamFactory,
  markBranchStreamUpdatedFactory
} from '@/modules/core/repositories/streams'
import { ModelsEmitter } from '@/modules/core/events/modelsEmitter'
import { legacyGetUserFactory } from '@/modules/core/repositories/users'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { getPaginatedStreamBranchesFactory } from '@/modules/core/services/branch/retrieval'

const markBranchStreamUpdated = markBranchStreamUpdatedFactory({ db })
const getStream = getStreamFactory({ db })
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
  }
} as Resolvers
