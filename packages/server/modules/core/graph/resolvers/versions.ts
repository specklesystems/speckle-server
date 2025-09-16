import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  filteredSubscribe,
  ProjectSubscriptions
} from '@/modules/shared/utils/subscriptions'
import {
  getServerOrigin,
  isRateLimiterEnabled
} from '@/modules/shared/helpers/envHelper'
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
import { throwIfRateLimitedFactory } from '@/modules/core/utils/ratelimiter'
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
  getStreamsFactory
} from '@/modules/core/repositories/streams'
import { getObjectFactory } from '@/modules/core/repositories/objects'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import coreModule from '@/modules/core'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { StreamNotFoundError } from '@/modules/core/errors/stream'
import { throwIfResourceAccessNotAllowed } from '@/modules/core/helpers/token'
import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import { withOperationLogging } from '@/observability/domain/businessLogging'
import { isCreatedBeyondHistoryLimitCutoffFactory } from '@/modules/gatekeeperCore/utils/limits'
import { SourceApps } from '@speckle/shared'

const throwIfRateLimited = throwIfRateLimitedFactory({
  rateLimiterEnabled: isRateLimiterEnabled()
})

export default {
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
    sourceApplication: async (parent) => {
      const knownSourceApp = SourceApps.find((app) =>
        parent.sourceApplication?.toLowerCase().includes(app.searchKey)
      )
      // we map known source apps to their search keys (aka slug)
      // except for search keys which begin with a "-"
      // they are partial search key patterns.
      // those source apps are already sent as slugs by connectors, so no need to remap
      if (knownSourceApp && !knownSourceApp.searchKey.startsWith('-')) {
        return knownSourceApp.searchKey
      }
      return parent.sourceApplication
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

      const isBeyondLimit = await isCreatedBeyondHistoryLimitCutoffFactory({ ctx })({
        entity: parent,
        limitType: 'versionsHistory',
        project
      })

      const latestVersions = await ctx.loaders
        .forRegion({ db: projectDB })
        .streams.getLatestVersions.load(parent.streamId)

      if (latestVersions?.find((lv) => lv.id === parent.id))
        return parent.referencedObject
      if (isBeyondLimit) return null
      return parent.referencedObject
    }
  },
  Mutation: {
    versionMutations: () => ({})
  },
  VersionMutations: {
    async moveToModel(_parent, args, ctx) {
      const projectId = args.input.projectId
      const versionIds = args.input.versionIds
      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: ctx.resourceAccessRules
      })

      const logger = ctx.log.child({
        projectId,
        streamId: projectId, //legacy
        versionIds
      })

      const canUpdateAll = await Promise.all(
        versionIds.map(async (versionId) =>
          ctx.authPolicies.project.version.canUpdate({
            userId: ctx.userId,
            projectId,
            versionId
          })
        )
      )
      canUpdateAll.forEach((result) => {
        throwIfAuthNotOk(result)
      })

      const projectDb = await getProjectDbClient({ projectId })

      const batchMoveCommits = batchMoveCommitsFactory({
        getCommits: getCommitsFactory({ db: projectDb }),
        getStreams: getStreamsFactory({ db: projectDb }),
        getStreamBranchByName: getStreamBranchByNameFactory({ db: projectDb }),
        createBranch: createBranchFactory({ db: projectDb }),
        moveCommitsToBranch: moveCommitsToBranchFactory({ db: projectDb }),
        emitEvent: getEventBus().emit
      })
      return await withOperationLogging(
        async () => await batchMoveCommits(args.input, ctx.userId!),
        {
          logger,
          operationName: 'moveVersionsToModel',
          operationDescription: `Move versions to model`
        }
      )
    },
    async delete(_parent, args, ctx) {
      const projectId = args.input.projectId
      const versionIds = args.input.versionIds
      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: ctx.resourceAccessRules
      })

      const logger = ctx.log.child({
        projectId,
        streamId: projectId, //legacy
        versionIds
      })

      const canUpdateAll = await Promise.all(
        versionIds.map(async (versionId) =>
          ctx.authPolicies.project.version.canUpdate({
            userId: ctx.userId,
            projectId,
            versionId
          })
        )
      )
      canUpdateAll.forEach((result) => {
        throwIfAuthNotOk(result)
      })

      const projectDb = await getProjectDbClient({ projectId })

      const batchDeleteCommits = batchDeleteCommitsFactory({
        getCommits: getCommitsFactory({ db: projectDb }),
        getStreams: getStreamsFactory({ db: projectDb }),
        deleteCommits: deleteCommitsFactory({ db: projectDb }),
        emitEvent: getEventBus().emit
      })
      await withOperationLogging(
        async () => await batchDeleteCommits(args.input, ctx.userId!),
        {
          logger,
          operationName: 'deleteVersions',
          operationDescription: `Delete versions`
        }
      )
      return true
    },
    async update(_parent, args, ctx) {
      const projectId = args.input.projectId
      const versionId = args.input.versionId
      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: ctx.resourceAccessRules
      })

      const logger = ctx.log.child({
        projectId,
        streamId: projectId, //legacy
        versionId,
        commitId: versionId //legacy
      })

      const canUpdate = await ctx.authPolicies.project.version.canUpdate({
        userId: ctx.userId,
        projectId,
        versionId
      })
      throwIfAuthNotOk(canUpdate)

      const projectDb = await getProjectDbClient({ projectId })
      const stream = await ctx.loaders
        .forRegion({ db: projectDb })
        .commits.getCommitStream.load(versionId)
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
        markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db: projectDb })
      })
      return await withOperationLogging(
        async () => await updateCommitAndNotify(args.input, ctx.userId!),
        {
          logger,
          operationName: 'updateVersion',
          operationDescription: `Update version`
        }
      )
    },
    async create(_parent, args, ctx) {
      await throwIfRateLimited({
        action: 'COMMIT_CREATE',
        source: ctx.userId!
      })

      const projectId = args.input.projectId
      const modelId = args.input.modelId

      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: ctx.resourceAccessRules
      })

      const logger = ctx.log.child({
        projectId,
        streamId: projectId, //legacy
        modelId,
        branchId: modelId //legacy
      })

      const canCreate = await ctx.authPolicies.project.version.canCreate({
        userId: ctx.userId,
        projectId
      })
      throwIfAuthNotOk(canCreate)

      await coreModule.executeHooks('onCreateVersionRequest', {
        projectId
      })

      const projectDb = await getProjectDbClient({ projectId })

      const createCommitByBranchId = createCommitByBranchIdFactory({
        createCommit: createCommitFactory({ db: projectDb }),
        getObject: getObjectFactory({ db: projectDb }),
        getBranchById: getBranchByIdFactory({ db: projectDb }),
        insertStreamCommits: insertStreamCommitsFactory({ db: projectDb }),
        insertBranchCommits: insertBranchCommitsFactory({ db: projectDb }),
        markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db: projectDb }),
        emitEvent: getEventBus().emit
      })

      const commit = await withOperationLogging(
        async () =>
          await createCommitByBranchId({
            authorId: ctx.userId!,
            streamId: args.input.projectId,
            branchId: args.input.modelId,
            message: args.input.message || null,
            sourceApplication: args.input.sourceApplication || null,
            objectId: args.input.objectId,
            parents: args.input.parents || []
          }),
        {
          logger,
          operationName: 'createVersion',
          operationDescription: `Create a new version`
        }
      )

      return commit
    },

    async markReceived(_parent, args, ctx) {
      const projectId = args.input.projectId
      const versionId = args.input.versionId
      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: ctx.resourceAccessRules
      })

      const logger = ctx.log.child({
        projectId,
        streamId: projectId, //legacy
        versionId,
        commitId: versionId //legacy
      })

      const canReceive = await ctx.authPolicies.project.version.canReceive({
        userId: ctx.userId,
        projectId
      })
      throwIfAuthNotOk(canReceive)

      const projectDb = await getProjectDbClient({ projectId })

      await withOperationLogging(
        async () =>
          await markCommitReceivedAndNotifyFactory({
            getCommit: getCommitFactory({ db: projectDb }),
            emitEvent: getEventBus().emit
          })({
            input: args.input,
            userId: ctx.userId!
          }),
        {
          logger,
          operationName: 'markVersionReceived',
          operationDescription: `Mark version as received`
        }
      )

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
