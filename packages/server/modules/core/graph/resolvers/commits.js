'use strict'

const { UserInputError, ApolloError } = require('apollo-server-express')
const { withFilter } = require('graphql-subscriptions')
const { authorizeResolver, pubsub, CommitPubsubEvents } = require('@/modules/shared')

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
  deleteCommitAndNotify
} = require('@/modules/core/services/commit/management')
const {
  addCommitReceivedActivity
} = require('@/modules/activitystream/services/commitActivity')

const { getUser } = require('../../services/users')

const {
  isRateLimitBreached,
  getRateLimitResult,
  RateLimitError,
  RateLimitAction
} = require('@/modules/core/services/ratelimiter')
const {
  batchMoveCommits,
  batchDeleteCommits
} = require('@/modules/core/services/commit/batchCommitActions')
const {
  validateStreamAccess
} = require('@/modules/core/services/streams/streamAccessService')
const { StreamInvalidAccessError } = require('@/modules/core/errors/stream')

// subscription events
const COMMIT_CREATED = CommitPubsubEvents.CommitCreated
const COMMIT_UPDATED = CommitPubsubEvents.CommitUpdated
const COMMIT_DELETED = CommitPubsubEvents.CommitDeleted

/**
 * @param {boolean} publicOnly
 * @param {string} userId
 * @param {{limit: number, cursor: string}} args
 * @returns
 */
const getUserCommits = async (publicOnly, userId, args) => {
  const totalCount = await getCommitsTotalCountByUserId({ userId, publicOnly })
  if (args.limit && args.limit > 100)
    throw new UserInputError(
      'Cannot return more than 100 items, please use pagination.'
    )
  const { commits: items, cursor } = await getCommitsByUserId({
    userId,
    limit: args.limit,
    cursor: args.cursor,
    publicOnly
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

      await validateStreamAccess(ctx.userId, stream.id)
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

      const authorEntity = await ctx.loaders.users.getUser.load(authorId || author)
      return authorEntity?.name || null
    },
    async authorAvatar(parent, _args, ctx) {
      const { authorId, authorAvatar, author } = parent
      if (authorAvatar) return authorAvatar

      const authorEntity = await ctx.loaders.users.getUser.load(authorId || author)
      return authorEntity?.avatar || null
    },
    async branchName(parent, _args, ctx) {
      const { id } = parent
      return (await ctx.loaders.commits.getCommitBranch.load(id))?.name || null
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
        throw new ApolloError(
          'Cannot retrieve commit (there are no commits in this stream).'
        )
      }
      const c = await getCommitById({ streamId: parent.id, id: args.id })
      return c
    }
  },
  LimitedUser: {
    async commits(parent, args) {
      return await getUserCommits(true, parent.id, args)
    }
  },
  User: {
    async commits(parent, args, context) {
      return await getUserCommits(context.userId !== parent.id, parent.id, args)
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
        'stream:contributor'
      )

      const rateLimitResult = await getRateLimitResult(
        RateLimitAction.COMMIT_CREATE,
        context.userId
      )
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
        'stream:contributor'
      )

      await updateCommitAndNotify(args.commit, context.userId)
      return true
    },

    async commitReceive(parent, args, context) {
      await authorizeResolver(context.userId, args.input.streamId, 'stream:reviewer')

      const commit = await getCommitById({
        streamId: args.input.streamId,
        id: args.input.commitId
      })
      const user = await getUser(context.userId)

      if (commit && user) {
        await addCommitReceivedActivity({ input: args.input, userId: user.id })
        return true
      }

      return false
    },

    async commitDelete(_parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.commit.streamId,
        'stream:contributor'
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
          await authorizeResolver(context.userId, payload.streamId, 'stream:reviewer')
          return payload.streamId === variables.streamId
        }
      )
    },

    commitUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([COMMIT_UPDATED]),
        async (payload, variables, context) => {
          await authorizeResolver(context.userId, payload.streamId, 'stream:reviewer')

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
          await authorizeResolver(context.userId, payload.streamId, 'stream:reviewer')

          return payload.streamId === variables.streamId
        }
      )
    }
  }
}
