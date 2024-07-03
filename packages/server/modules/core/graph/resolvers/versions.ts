import { Roles } from '@speckle/shared'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { authorizeResolver } from '@/modules/shared'
import {
  filteredSubscribe,
  ProjectSubscriptions
} from '@/modules/shared/utils/subscriptions'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import {
  batchDeleteCommits,
  batchMoveCommits
} from '@/modules/core/services/commit/batchCommitActions'
import { CommitUpdateError } from '@/modules/core/errors/commit'
import {
  createCommitByBranchId,
  markCommitReceivedAndNotify,
  updateCommitAndNotify
} from '@/modules/core/services/commit/management'
import {
  getRateLimitResult,
  isRateLimitBreached
} from '@/modules/core/services/ratelimiter'
import { RateLimitError } from '@/modules/core/errors/ratelimit'

export = {
  Project: {
    async version(parent, args, ctx) {
      return await ctx.loaders.streams.getStreamCommit
        .forStream(parent.id)
        .load(args.id)
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
