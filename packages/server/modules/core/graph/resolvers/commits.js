'use strict'

const { CommitNotFoundError } = require('@/modules/core/errors/commit')
const { UserInputError } = require('apollo-server-express')
const { withFilter } = require('graphql-subscriptions')
const {
  pubsub,
  CommitSubscriptions: CommitPubsubEvents
} = require('@/modules/shared/utils/subscriptions')
const { authorizeResolver } = require('@/modules/shared')

const {
  getCommitById,
  getCommitsByUserId,
  getCommitsByStreamId,
  getCommitsTotalCountByUserId
} = require('../../services/commits')
const {
  getPaginatedStreamCommits,
  getPaginatedBranchCommits
} = require('@/modules/core/services/commit/retrieval')
const {
  createCommitByBranchName,
  updateCommitAndNotify,
  deleteCommitAndNotify,
  markCommitReceivedAndNotify
} = require('@/modules/core/services/commit/management')

const { RateLimitError } = require('@/modules/core/errors/ratelimit')
const {
  isRateLimitBreached,
  getRateLimitResult
} = require('@/modules/core/services/ratelimiter')
const {
  batchMoveCommits,
  batchDeleteCommits
} = require('@/modules/core/services/commit/batchCommitActions')
const {
  validateStreamAccess
} = require('@/modules/core/services/streams/streamAccessService')
const { StreamInvalidAccessError } = require('@/modules/core/errors/stream')
const { Roles } = require('@speckle/shared')
const { toProjectIdWhitelist } = require('@/modules/core/helpers/token')

// subscription events
const COMMIT_CREATED = CommitPubsubEvents.CommitCreated
const COMMIT_UPDATED = CommitPubsubEvents.CommitUpdated
const COMMIT_DELETED = CommitPubsubEvents.CommitDeleted

/**
 * @param {boolean} publicOnly
 * @param {string} userId
 * @param {{limit: number, cursor: string}} args
 * @param {string[] | undefined} streamIdWhitelist
 * @returns
 */
const getUserCommits = async (publicOnly, userId, args, streamIdWhitelist) => {
  const totalCount = await getCommitsTotalCountByUserId({
    userId,
    publicOnly,
    streamIdWhitelist
  })
  if (args.limit && args.limit > 100)
    throw new UserInputError(
      'Cannot return more than 100 items, please use pagination.'
    )
  const { commits: items, cursor } = await getCommitsByUserId({
    userId,
    limit: args.limit,
    cursor: args.cursor,
    publicOnly,
    streamIdWhitelist
  })

  return { items, cursor, totalCount }
}

/** @type {import('@/modules/core/graph/generated/graphql').Resolvers} */
module.exports = {
  Query: {},
  Commit: {
    async stream(parent, _args, ctx) {
      const { id: commitId } = parent

      const stream = await ctx.loaders.commits.getCommitStream.load(commitId)
      if (!stream) {
        throw new StreamInvalidAccessError('Commit stream not found')
      }

      await validateStreamAccess(
        ctx.userId,
        stream.id,
        Roles.Stream.Reviewer,
        ctx.resourceAccessRules
      )
      return stream
    },
    async streamId(parent, _args, ctx) {
      const { id: commitId } = parent
      const stream = await ctx.loaders.commits.getCommitStream.load(commitId)
      return stream?.id || null
    },
    async streamName(parent, _args, ctx) {
      const { id: commitId } = parent
      const stream = await ctx.loaders.commits.getCommitStream.load(commitId)
      return stream?.name || null
    },
    /**
     * The DB schema actually has the value under 'author', but some queries (not all)
     * remap it to 'authorId'
     */
    async authorId(parent) {
      return parent.authorId || parent.author
    },
    async authorName(parent, _args, ctx) {
      const { authorId, authorName, author } = parent
      if (authorName) return authorName
      if (!authorId && !author) return null
      const authorEntity = await ctx.loaders.users.getUser.load(authorId || author)
      return authorEntity?.name || null
    },
    async authorAvatar(parent, _args, ctx) {
      const { authorId, authorAvatar, author } = parent
      if (authorAvatar) return authorAvatar
      if (!authorId && !author) return null

      const authorEntity = await ctx.loaders.users.getUser.load(authorId || author)
      return authorEntity?.avatar || null
    },
    async branchName(parent, _args, ctx) {
      const { id } = parent
      return (await ctx.loaders.commits.getCommitBranch.load(id))?.name || null
    },
    async branch(parent, _args, ctx) {
      const { id } = parent
      return await ctx.loaders.commits.getCommitBranch.load(id)
    }
  },
  Stream: {
    async commits(parent, args) {
      return await getPaginatedStreamCommits(parent.id, args)
    },

    async commit(parent, args) {
      if (!args.id) {
        const { commits } = await getCommitsByStreamId({
          streamId: parent.id,
          limit: 1
        })
        if (commits.length !== 0) return commits[0]
        throw new CommitNotFoundError(
          'Cannot retrieve commit (there are no commits in this stream).'
        )
      }
      const c = await getCommitById({ streamId: parent.id, id: args.id })
      return c
    }
  },
  LimitedUser: {
    async commits(parent, args, ctx) {
      return await getUserCommits(
        true,
        parent.id,
        args,
        toProjectIdWhitelist(ctx.resourceAccessRules)
      )
    }
  },
  User: {
    async commits(parent, args, context) {
      return await getUserCommits(
        context.userId !== parent.id,
        parent.id,
        args,
        toProjectIdWhitelist(context.resourceAccessRules)
      )
    }
  },
  Branch: {
    async commits(parent, args) {
      return await getPaginatedBranchCommits({
        branchId: parent.id,
        limit: args.limit,
        cursor: args.cursor
      })
    }
  },
  Mutation: {
    async commitCreate(parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.commit.streamId,
        Roles.Stream.Contributor,
        context.resourceAccessRules
      )

      const rateLimitResult = await getRateLimitResult('COMMIT_CREATE', context.userId)
      if (isRateLimitBreached(rateLimitResult)) {
        throw new RateLimitError(rateLimitResult)
      }

      const { id } = await createCommitByBranchName({
        ...args.commit,
        authorId: context.userId
      })

      return id
    },

    async commitUpdate(_parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.commit.streamId,
        Roles.Stream.Contributor,
        context.resourceAccessRules
      )

      await updateCommitAndNotify(args.commit, context.userId)
      return true
    },

    async commitReceive(parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.input.streamId,
        Roles.Stream.Reviewer,
        context.resourceAccessRules
      )

      await markCommitReceivedAndNotify({
        input: args.input,
        userId: context.userId
      })

      return true
    },

    async commitDelete(_parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.commit.streamId,
        Roles.Stream.Contributor,
        context.resourceAccessRules
      )

      const deleted = await deleteCommitAndNotify(
        args.commit.id,
        args.commit.streamId,
        context.userId
      )
      return deleted
    },

    async commitsMove(_, args, ctx) {
      await batchMoveCommits(args.input, ctx.userId)
      return true
    },

    async commitsDelete(_, args, ctx) {
      await batchDeleteCommits(args.input, ctx.userId)
      return true
    }
  },
  Subscription: {
    commitCreated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([COMMIT_CREATED]),
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

    commitUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([COMMIT_UPDATED]),
        async (payload, variables, context) => {
          await authorizeResolver(
            context.userId,
            payload.streamId,
            Roles.Stream.Reviewer,
            context.resourceAccessRules
          )

          const streamMatch = payload.streamId === variables.streamId
          if (streamMatch && variables.commitId) {
            return payload.commitId === variables.commitId
          }

          return streamMatch
        }
      )
    },

    commitDeleted: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([COMMIT_DELETED]),
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
