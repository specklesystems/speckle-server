import { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  filteredSubscribe,
  ProjectSubscriptions
} from '@/modules/shared/utils/subscriptions'
import { getFeatureFlags, getServerOrigin } from '@/modules/shared/helpers/envHelper'
import {
  batchDeleteCommitsFactory,
  batchMoveCommitsFactory
} from '@/modules/core/services/commit/batchCommitActions'
import { CommitNotFoundError, CommitUpdateError } from '@/modules/core/errors/commit'
import {
  createCommitByBranchIdFactory,
  markCommitReceivedAndNotifyFactory,
  updateCommitAndNotifyFactory
} from '@/modules/core/services/commit/management'
import {
  getRateLimitResult,
  isRateLimitBreached
} from '@/modules/core/services/ratelimiter'
import { RateLimitError } from '@/modules/core/errors/ratelimit'
import {
  createCommitFactory,
  deleteCommitsFactory,
  getCommitBranchFactory,
  getCommitFactory,
  getCommitsFactory,
  insertBranchCommitsFactory,
  insertStreamCommitsFactory,
  moveCommitsToBranchFactory,
  switchCommitBranchFactory,
  updateCommitFactory
} from '@/modules/core/repositories/commits'
import {
  createBranchFactory,
  getBranchByIdFactory,
  getStreamBranchByNameFactory,
  markCommitBranchUpdatedFactory
} from '@/modules/core/repositories/branches'
import {
  getCommitStreamFactory,
  getStreamFactory,
  getStreamsFactory,
  markCommitStreamUpdatedFactory
} from '@/modules/core/repositories/streams'
import { getObjectFactory } from '@/modules/core/repositories/objects'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import coreModule from '@/modules/core'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { StreamNotFoundError } from '@/modules/core/errors/stream'
import { getLimitedReferencedObjectFactory } from '@/modules/core/services/versions/limits'
import { throwIfResourceAccessNotAllowed } from '@/modules/core/helpers/token'
import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'

const { FF_FORCE_PERSONAL_PROJECTS_LIMITS_ENABLED } = getFeatureFlags()

export = {
  Project: {
    async version(parent, args, ctx) {
      const projectDB = await getProjectDbClient({ projectId: parent.id })
      const version = await ctx.loaders
        .forRegion({ db: projectDB })
        .streams.getStreamCommit.forStream(parent.id)
        .load(args.id)
      if (!version) {
        throw new CommitNotFoundError('Version not found')
      }

      return version
    }
  },
  Version: {
    async authorUser(parent, _args, ctx) {
      const { author } = parent
      if (!author) return null
      const projectDB = await getProjectDbClient({ projectId: parent.streamId })
      return (
        (await ctx.loaders.forRegion({ db: projectDB }).users.getUser.load(author)) ||
        null
      )
    },
    async model(parent, _args, ctx) {
      const projectDB = await getProjectDbClient({ projectId: parent.streamId })
      return await ctx.loaders
        .forRegion({ db: projectDB })
        .commits.getCommitBranch.load(parent.id)
    },
    async previewUrl(parent, _args, ctx) {
      const projectDB = await getProjectDbClient({ projectId: parent.streamId })
      const stream = await ctx.loaders
        .forRegion({ db: projectDB })
        .commits.getCommitStream.load(parent.id)
      if (!stream)
        throw new StreamNotFoundError('Project not found', {
          info: { streamId: parent.streamId }
        })
      const path = `/preview/${stream.id}/commits/${parent.id}`
      return new URL(path, getServerOrigin()).toString()
    },
    referencedObject: async (parent, _args, ctx) => {
      const projectDB = await getProjectDbClient({ projectId: parent.streamId })
      const project = await ctx.loaders
        .forRegion({ db: projectDB })
        .commits.getCommitStream.load(parent.id)

      if (!project) {
        throw new StreamNotFoundError('Project not found', {
          info: { streamId: parent.streamId }
        })
      }

      const lastVersion = await ctx.loaders.streams.getLastVersion.load(project.id)
      if (lastVersion?.id === parent.id) return parent.referencedObject

      return await getLimitedReferencedObjectFactory({
        environment: {
          personalProjectsLimitEnabled: FF_FORCE_PERSONAL_PROJECTS_LIMITS_ENABLED
        },
        getWorkspaceLimits: ctx.authLoaders.getWorkspaceLimits
      })({ version: parent, project })
    }
  },
  Mutation: {
    versionMutations: () => ({})
  },
  VersionMutations: {
    async moveToModel(_parent, args, ctx) {
      throwIfResourceAccessNotAllowed({
        resourceId: args.input.projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: ctx.resourceAccessRules
      })

      const canUpdateAll = await Promise.all(
        args.input.versionIds.map(async (versionId) =>
          ctx.authPolicies.project.version.canUpdate({
            userId: ctx.userId,
            projectId: args.input.projectId,
            versionId
          })
        )
      )
      canUpdateAll.forEach((result) => {
        throwIfAuthNotOk(result)
      })

      const projectId = args.input.projectId
      const projectDb = await getProjectDbClient({ projectId })

      const batchMoveCommits = batchMoveCommitsFactory({
        getCommits: getCommitsFactory({ db: projectDb }),
        getStreams: getStreamsFactory({ db: projectDb }),
        getStreamBranchByName: getStreamBranchByNameFactory({ db: projectDb }),
        createBranch: createBranchFactory({ db: projectDb }),
        moveCommitsToBranch: moveCommitsToBranchFactory({ db: projectDb }),
        emitEvent: getEventBus().emit
      })
      return await batchMoveCommits(args.input, ctx.userId!)
    },
    async delete(_parent, args, ctx) {
      throwIfResourceAccessNotAllowed({
        resourceId: args.input.projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: ctx.resourceAccessRules
      })

      const canUpdateAll = await Promise.all(
        args.input.versionIds.map(async (versionId) =>
          ctx.authPolicies.project.version.canUpdate({
            userId: ctx.userId,
            projectId: args.input.projectId,
            versionId
          })
        )
      )
      canUpdateAll.forEach((result) => {
        throwIfAuthNotOk(result)
      })

      const projectId = args.input.projectId
      const projectDb = await getProjectDbClient({ projectId })

      const batchDeleteCommits = batchDeleteCommitsFactory({
        getCommits: getCommitsFactory({ db: projectDb }),
        getStreams: getStreamsFactory({ db: projectDb }),
        deleteCommits: deleteCommitsFactory({ db: projectDb }),
        emitEvent: getEventBus().emit
      })
      await batchDeleteCommits(args.input, ctx.userId!)
      return true
    },
    async update(_parent, args, ctx) {
      throwIfResourceAccessNotAllowed({
        resourceId: args.input.projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: ctx.resourceAccessRules
      })

      const canUpdate = await ctx.authPolicies.project.version.canUpdate({
        userId: ctx.userId,
        projectId: args.input.projectId,
        versionId: args.input.versionId
      })
      throwIfAuthNotOk(canUpdate)

      const projectId = args.input.projectId
      const projectDb = await getProjectDbClient({ projectId })
      const stream = await ctx.loaders
        .forRegion({ db: projectDb })
        .commits.getCommitStream.load(args.input.versionId)
      if (!stream) {
        throw new CommitUpdateError('Commit stream not found')
      }

      const updateCommitAndNotify = updateCommitAndNotifyFactory({
        getCommit: getCommitFactory({ db: projectDb }),
        getStream: getStreamFactory({ db: projectDb }),
        getCommitStream: getCommitStreamFactory({ db: projectDb }),
        getStreamBranchByName: getStreamBranchByNameFactory({ db: projectDb }),
        getCommitBranch: getCommitBranchFactory({ db: projectDb }),
        switchCommitBranch: switchCommitBranchFactory({ db: projectDb }),
        updateCommit: updateCommitFactory({ db: projectDb }),
        emitEvent: getEventBus().emit,
        markCommitStreamUpdated: markCommitStreamUpdatedFactory({ db: projectDb }),
        markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db: projectDb })
      })
      return await updateCommitAndNotify(args.input, ctx.userId!)
    },
    async create(_parent, args, ctx) {
      const rateLimitResult = await getRateLimitResult('COMMIT_CREATE', ctx.userId!)
      if (isRateLimitBreached(rateLimitResult)) {
        throw new RateLimitError(rateLimitResult)
      }

      throwIfResourceAccessNotAllowed({
        resourceId: args.input.projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: ctx.resourceAccessRules
      })

      const canCreate = await ctx.authPolicies.project.version.canCreate({
        userId: ctx.userId,
        projectId: args.input.projectId
      })
      throwIfAuthNotOk(canCreate)

      await coreModule.executeHooks('onCreateVersionRequest', {
        projectId: args.input.projectId
      })

      const projectDb = await getProjectDbClient({ projectId: args.input.projectId })

      const createCommitByBranchId = createCommitByBranchIdFactory({
        createCommit: createCommitFactory({ db: projectDb }),
        getObject: getObjectFactory({ db: projectDb }),
        getBranchById: getBranchByIdFactory({ db: projectDb }),
        insertStreamCommits: insertStreamCommitsFactory({ db: projectDb }),
        insertBranchCommits: insertBranchCommitsFactory({ db: projectDb }),
        markCommitStreamUpdated: markCommitStreamUpdatedFactory({ db: projectDb }),
        markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db: projectDb }),
        emitEvent: getEventBus().emit
      })

      const commit = await createCommitByBranchId({
        authorId: ctx.userId!,
        streamId: args.input.projectId,
        branchId: args.input.modelId,
        message: args.input.message || null,
        sourceApplication: args.input.sourceApplication || null,
        objectId: args.input.objectId,
        parents: args.input.parents || []
      })

      return commit
    },

    async markReceived(_parent, args, ctx) {
      throwIfResourceAccessNotAllowed({
        resourceId: args.input.projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: ctx.resourceAccessRules
      })

      const canReceive = await ctx.authPolicies.project.version.canReceive({
        userId: ctx.userId,
        projectId: args.input.projectId
      })
      throwIfAuthNotOk(canReceive)

      const projectDb = await getProjectDbClient({ projectId: args.input.projectId })

      await markCommitReceivedAndNotifyFactory({
        getCommit: getCommitFactory({ db: projectDb }),
        emitEvent: getEventBus().emit
      })({
        input: args.input,
        userId: ctx.userId!
      })

      return true
    }
  },
  Subscription: {
    projectVersionsUpdated: {
      subscribe: filteredSubscribe(
        ProjectSubscriptions.ProjectVersionsUpdated,
        async (payload, args, ctx) => {
          if (payload.projectId !== args.id) return false

          throwIfResourceAccessNotAllowed({
            resourceId: payload.projectId,
            resourceType: TokenResourceIdentifierType.Project,
            resourceAccessRules: ctx.resourceAccessRules
          })
          const canReadProject = await ctx.authPolicies.project.canRead({
            userId: ctx.userId,
            projectId: payload.projectId
          })
          throwIfAuthNotOk(canReadProject)

          return true
        }
      )
    },
    projectVersionsPreviewGenerated: {
      subscribe: filteredSubscribe(
        ProjectSubscriptions.ProjectVersionsPreviewGenerated,
        async (payload, args, ctx) => {
          if (payload.projectVersionsPreviewGenerated.projectId !== args.id)
            return false

          throwIfResourceAccessNotAllowed({
            resourceId: payload.projectVersionsPreviewGenerated.projectId,
            resourceType: TokenResourceIdentifierType.Project,
            resourceAccessRules: ctx.resourceAccessRules
          })

          const canReadProject = await ctx.authPolicies.project.canRead({
            userId: ctx.userId,
            projectId: payload.projectVersionsPreviewGenerated.projectId
          })
          throwIfAuthNotOk(canReadProject)
          return true
        }
      )
    }
  }
} as Resolvers
