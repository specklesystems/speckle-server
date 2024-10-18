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
  batchDeleteCommits,
  batchMoveCommitsFactory
} from '@/modules/core/services/commit/batchCommitActions'
import { CommitNotFoundError, CommitUpdateError } from '@/modules/core/errors/commit'
import {
  createCommitByBranchIdFactory,
  markCommitReceivedAndNotify,
  updateCommitAndNotifyFactory
} from '@/modules/core/services/commit/management'
import {
  getRateLimitResult,
  isRateLimitBreached
} from '@/modules/core/services/ratelimiter'
import { RateLimitError } from '@/modules/core/errors/ratelimit'
import {
  createCommitFactory,
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
  addCommitMovedActivityFactory,
  addCommitUpdatedActivityFactory
} from '@/modules/activitystream/services/commitActivity'
import { getObjectFactory } from '@/modules/core/repositories/objects'
import { saveActivityFactory } from '@/modules/activitystream/repositories'

const markCommitStreamUpdated = markCommitStreamUpdatedFactory({ db })
const getCommitStream = getCommitStreamFactory({ db })
const getStream = getStreamFactory({ db })
const getStreams = getStreamsFactory({ db })
const getObject = getObjectFactory({ db })
const createCommitByBranchId = createCommitByBranchIdFactory({
  createCommit: createCommitFactory({ db }),
  getObject,
  getBranchById: getBranchByIdFactory({ db }),
  insertStreamCommits: insertStreamCommitsFactory({ db }),
  insertBranchCommits: insertBranchCommitsFactory({ db }),
  markCommitStreamUpdated,
  markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db }),
  versionsEventEmitter: VersionsEmitter.emit,
  addCommitCreatedActivity: addCommitCreatedActivityFactory({
    saveActivity: saveActivityFactory({ db }),
    publish
  })
})

const updateCommitAndNotify = updateCommitAndNotifyFactory({
  getCommit: getCommitFactory({ db }),
  getStream,
  getCommitStream,
  getStreamBranchByName: getStreamBranchByNameFactory({ db }),
  getCommitBranch: getCommitBranchFactory({ db }),
  switchCommitBranch: switchCommitBranchFactory({ db }),
  updateCommit: updateCommitFactory({ db }),
  addCommitUpdatedActivity: addCommitUpdatedActivityFactory({
    saveActivity: saveActivityFactory({ db }),
    publish
  }),
  markCommitStreamUpdated,
  markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db })
})

const batchMoveCommits = batchMoveCommitsFactory({
  getCommits: getCommitsFactory({ db }),
  getStreams,
  getStreamBranchByName: getStreamBranchByNameFactory({ db }),
  createBranch: createBranchFactory({ db }),
  moveCommitsToBranch: moveCommitsToBranchFactory({ db }),
  addCommitMovedActivity: addCommitMovedActivityFactory({
    saveActivity: saveActivityFactory({ db }),
    publish
  })
})

export = {
  Project: {
    async version(parent, args, ctx) {
      const version = await ctx.loaders.streams.getStreamCommit
        .forStream(parent.id)
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
      return (await ctx.loaders.users.getUser.load(author)) || null
    },
    async model(parent, _args, ctx) {
      return await ctx.loaders.commits.getCommitBranch.load(parent.id)
    },
    async previewUrl(parent, _args, ctx) {
      const stream = await ctx.loaders.commits.getCommitStream.load(parent.id)
      const path = `/preview/${stream!.id}/commits/${parent.id}`
      return new URL(path, getServerOrigin()).toString()
    }
  },
  Mutation: {
    versionMutations: () => ({})
  },
  VersionMutations: {
    async moveToModel(_parent, args, ctx) {
      return await batchMoveCommits(args.input, ctx.userId!)
    },
    async delete(_parent, args, ctx) {
      await batchDeleteCommits(args.input, ctx.userId!)
      return true
    },
    async update(_parent, args, ctx) {
      const stream = await ctx.loaders.commits.getCommitStream.load(
        args.input.versionId
      )
      if (!stream) {
        throw new CommitUpdateError('Commit stream not found')
      }

      await authorizeResolver(
        ctx.userId,
        stream.id,
        Roles.Stream.Contributor,
        ctx.resourceAccessRules
      )
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

      await markCommitReceivedAndNotify({
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
