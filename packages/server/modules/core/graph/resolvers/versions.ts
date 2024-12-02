import { Roles } from '@speckle/shared'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { authorizeResolver } from '@/modules/shared'
import {
  filteredSubscribe,
  ProjectSubscriptions,
  publish
} from '@/modules/shared/utils/subscriptions'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
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
import { db } from '@/db/knex'
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
import { VersionsEmitter } from '@/modules/core/events/versionsEmitter'
import {
  addCommitCreatedActivityFactory,
  addCommitDeletedActivityFactory,
  addCommitMovedActivityFactory,
  addCommitUpdatedActivityFactory
} from '@/modules/activitystream/services/commitActivity'
import { getObjectFactory } from '@/modules/core/repositories/objects'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import { getProjectDbClient } from '@/modules/multiregion/dbSelector'

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
      const path = `/preview/${stream!.id}/commits/${parent.id}`
      return new URL(path, getServerOrigin()).toString()
    }
  },
  Mutation: {
    versionMutations: () => ({})
  },
  VersionMutations: {
    async moveToModel(_parent, args, ctx) {
      const projectId = args.input.projectId
      const projectDb = await getProjectDbClient({ projectId })

      const batchMoveCommits = batchMoveCommitsFactory({
        getCommits: getCommitsFactory({ db: projectDb }),
        getStreams: getStreamsFactory({ db: projectDb }),
        getStreamBranchByName: getStreamBranchByNameFactory({ db: projectDb }),
        createBranch: createBranchFactory({ db: projectDb }),
        moveCommitsToBranch: moveCommitsToBranchFactory({ db: projectDb }),
        addCommitMovedActivity: addCommitMovedActivityFactory({
          saveActivity: saveActivityFactory({ db }),
          publish
        })
      })
      return await batchMoveCommits(args.input, ctx.userId!)
    },
    async delete(_parent, args, ctx) {
      const projectId = args.input.projectId
      const projectDb = await getProjectDbClient({ projectId })

      const batchDeleteCommits = batchDeleteCommitsFactory({
        getCommits: getCommitsFactory({ db: projectDb }),
        getStreams: getStreamsFactory({ db: projectDb }),
        deleteCommits: deleteCommitsFactory({ db: projectDb }),
        addCommitDeletedActivity: addCommitDeletedActivityFactory({
          saveActivity: saveActivityFactory({ db }),
          publish
        })
      })
      await batchDeleteCommits(args.input, ctx.userId!)
      return true
    },
    async update(_parent, args, ctx) {
      const projectId = args.input.projectId
      const projectDb = await getProjectDbClient({ projectId })
      const stream = await ctx.loaders
        .forRegion({ db: projectDb })
        .commits.getCommitStream.load(args.input.versionId)
      if (!stream) {
        throw new CommitUpdateError('Commit stream not found')
      }

      await authorizeResolver(
        ctx.userId,
        stream.id,
        Roles.Stream.Contributor,
        ctx.resourceAccessRules
      )

      const updateCommitAndNotify = updateCommitAndNotifyFactory({
        getCommit: getCommitFactory({ db: projectDb }),
        getStream: getStreamFactory({ db: projectDb }),
        getCommitStream: getCommitStreamFactory({ db: projectDb }),
        getStreamBranchByName: getStreamBranchByNameFactory({ db: projectDb }),
        getCommitBranch: getCommitBranchFactory({ db: projectDb }),
        switchCommitBranch: switchCommitBranchFactory({ db: projectDb }),
        updateCommit: updateCommitFactory({ db: projectDb }),
        addCommitUpdatedActivity: addCommitUpdatedActivityFactory({
          saveActivity: saveActivityFactory({ db }),
          publish
        }),
        markCommitStreamUpdated: markCommitStreamUpdatedFactory({ db: projectDb }),
        markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db: projectDb })
      })
      return await updateCommitAndNotify(args.input, ctx.userId!)
    },
    async create(_parent, args, ctx) {
      await authorizeResolver(
        ctx.userId,
        args.input.projectId,
        Roles.Stream.Contributor,
        ctx.resourceAccessRules
      )

      const rateLimitResult = await getRateLimitResult('COMMIT_CREATE', ctx.userId!)
      if (isRateLimitBreached(rateLimitResult)) {
        throw new RateLimitError(rateLimitResult)
      }

      const projectDb = await getProjectDbClient({ projectId: args.input.projectId })

      const createCommitByBranchId = createCommitByBranchIdFactory({
        createCommit: createCommitFactory({ db: projectDb }),
        getObject: getObjectFactory({ db: projectDb }),
        getBranchById: getBranchByIdFactory({ db: projectDb }),
        insertStreamCommits: insertStreamCommitsFactory({ db: projectDb }),
        insertBranchCommits: insertBranchCommitsFactory({ db: projectDb }),
        markCommitStreamUpdated: markCommitStreamUpdatedFactory({ db: projectDb }),
        markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db: projectDb }),
        versionsEventEmitter: VersionsEmitter.emit,
        addCommitCreatedActivity: addCommitCreatedActivityFactory({
          saveActivity: saveActivityFactory({ db }),
          publish
        })
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
      await authorizeResolver(
        ctx.userId,
        args.input.projectId,
        Roles.Stream.Reviewer,
        ctx.resourceAccessRules
      )
      const projectDb = await getProjectDbClient({ projectId: args.input.projectId })

      await markCommitReceivedAndNotifyFactory({
        getCommit: getCommitFactory({ db: projectDb }),
        saveActivity: saveActivityFactory({ db })
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

          await authorizeResolver(
            ctx.userId,
            payload.projectId,
            Roles.Stream.Reviewer,
            ctx.resourceAccessRules
          )
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
          await authorizeResolver(
            ctx.userId,
            payload.projectVersionsPreviewGenerated.projectId,
            Roles.Stream.Reviewer,
            ctx.resourceAccessRules
          )
          return true
        }
      )
    }
  }
} as Resolvers
