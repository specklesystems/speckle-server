import { BranchPubsubEvents } from '@/modules/shared'
import {
  createBranchAndNotifyFactory,
  updateBranchAndNotifyFactory,
  deleteBranchAndNotifyFactory
} from '@/modules/core/services/branch/management'
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
  getStreamFactory,
  markBranchStreamUpdatedFactory
} from '@/modules/core/repositories/streams'
import { legacyGetUserFactory } from '@/modules/core/repositories/users'
import {
  Resolvers,
  TokenResourceIdentifierType
} from '@/modules/core/graph/generated/graphql'
import { getPaginatedStreamBranchesFactory } from '@/modules/core/services/branch/retrieval'
import { filteredSubscribe } from '@/modules/shared/utils/subscriptions'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  mapAuthToServerError,
  throwIfAuthNotOk
} from '@/modules/shared/helpers/errorHelper'
import { throwIfResourceAccessNotAllowed } from '@/modules/core/helpers/token'

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
      throwIfResourceAccessNotAllowed({
        resourceId: args.branch.streamId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: context.resourceAccessRules
      })

      const canCreate = await context.authPolicies.project.model.canCreate({
        userId: context.userId,
        projectId: args.branch.streamId
      })

      if (!canCreate.isOk) {
        throw mapAuthToServerError(canCreate.error)
      }

      const projectDB = await getProjectDbClient({ projectId: args.branch.streamId })
      const getStreamBranchByName = getStreamBranchByNameFactory({ db: projectDB })
      const createBranchAndNotify = createBranchAndNotifyFactory({
        getStreamBranchByName,
        createBranch: createBranchFactory({ db: projectDB }),
        eventEmit: getEventBus().emit
      })
      const { id } = await createBranchAndNotify(args.branch, context.userId!)

      return id
    },

    async branchUpdate(_parent, args, ctx) {
      throwIfResourceAccessNotAllowed({
        resourceId: args.branch.streamId,
        resourceAccessRules: ctx.resourceAccessRules,
        resourceType: TokenResourceIdentifierType.Project
      })

      const canUpdate = await ctx.authPolicies.project.model.canUpdate({
        userId: ctx.userId,
        projectId: args.branch.streamId
      })
      throwIfAuthNotOk(canUpdate)

      const projectDB = await getProjectDbClient({ projectId: args.branch.streamId })
      const getBranchById = getBranchByIdFactory({ db: projectDB })
      const updateBranchAndNotify = updateBranchAndNotifyFactory({
        getBranchById,
        updateBranch: updateBranchFactory({ db: projectDB }),
        eventEmit: getEventBus().emit
      })
      const newBranch = await updateBranchAndNotify(args.branch, ctx.userId!)
      return !!newBranch
    },

    async branchDelete(_parent, args, context) {
      throwIfResourceAccessNotAllowed({
        resourceId: args.branch.streamId,
        resourceAccessRules: context.resourceAccessRules,
        resourceType: TokenResourceIdentifierType.Project
      })

      const canDelete = await context.authPolicies.project.model.canDelete({
        userId: context.userId,
        projectId: args.branch.streamId,
        modelId: args.branch.id
      })
      throwIfAuthNotOk(canDelete)

      const projectDB = await getProjectDbClient({ projectId: args.branch.streamId })
      const markBranchStreamUpdated = markBranchStreamUpdatedFactory({ db: projectDB })
      const getStream = getStreamFactory({ db: projectDB })
      const deleteBranchAndNotify = deleteBranchAndNotifyFactory({
        getStream,
        getBranchById: getBranchByIdFactory({ db: projectDB }),
        emitEvent: getEventBus().emit,
        markBranchStreamUpdated,
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
          throwIfResourceAccessNotAllowed({
            resourceId: payload.streamId,
            resourceAccessRules: context.resourceAccessRules,
            resourceType: TokenResourceIdentifierType.Project
          })

          const canRead = await context.authPolicies.project.canRead({
            userId: context.userId,
            projectId: payload.streamId
          })
          throwIfAuthNotOk(canRead)

          return payload.streamId === variables.streamId
        }
      )
    },
    branchUpdated: {
      subscribe: filteredSubscribe(
        BranchPubsubEvents.BranchUpdated,
        async (payload, variables, context) => {
          throwIfResourceAccessNotAllowed({
            resourceId: payload.streamId,
            resourceAccessRules: context.resourceAccessRules,
            resourceType: TokenResourceIdentifierType.Project
          })

          const canRead = await context.authPolicies.project.canRead({
            userId: context.userId,
            projectId: payload.streamId
          })
          throwIfAuthNotOk(canRead)

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
          throwIfResourceAccessNotAllowed({
            resourceId: payload.streamId,
            resourceAccessRules: context.resourceAccessRules,
            resourceType: TokenResourceIdentifierType.Project
          })

          const canRead = await context.authPolicies.project.canRead({
            userId: context.userId,
            projectId: payload.streamId
          })
          throwIfAuthNotOk(canRead)

          return payload.streamId === variables.streamId
        }
      )
    }
  }
} as Resolvers
