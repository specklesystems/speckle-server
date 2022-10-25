'use strict'

const { ForbiddenError, UserInputError, ApolloError } = require('apollo-server-express')
const { withFilter } = require('graphql-subscriptions')
const { authorizeResolver, pubsub, CommitPubsubEvents } = require('@/modules/shared')
const { saveActivity } = require('@/modules/activitystream/services')
const { ActionTypes } = require('@/modules/activitystream/helpers/types')

const {
  createCommitByBranchName,
  updateCommit,
  deleteCommit,
  getCommitById,
  getCommitsByBranchId,
  getCommitsByUserId,
  getCommitsByStreamId,
  getCommitsTotalCountByStreamId,
  getCommitsTotalCountByUserId,
  getCommitsTotalCountByBranchId
} = require('../../services/commits')

const { getUser } = require('../../services/users')

const { respectsLimits } = require('../../services/ratelimits')
const {
  batchMoveCommits,
  batchDeleteCommits
} = require('@/modules/core/services/commit/batchCommitActions')
const {
  validateStreamAccess
} = require('@/modules/core/services/streams/streamAccessService')
const { StreamInvalidAccessError } = require('@/modules/core/errors/stream')
const {
  addCommitCreatedActivity
} = require('@/modules/activitystream/services/commitActivity')

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
    }
  },
  Stream: {
    async commits(parent, args) {
      if (args.limit && args.limit > 100)
        throw new UserInputError(
          'Cannot return more than 100 items, please use pagination.'
        )
      const { commits: items, cursor } = await getCommitsByStreamId({
        streamId: parent.id,
        limit: args.limit,
        cursor: args.cursor,
        ignoreGlobalsBranch: true
      })
      const totalCount = await getCommitsTotalCountByStreamId({
        streamId: parent.id,
        ignoreGlobalsBranch: true
      })

      return { items, cursor, totalCount }
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
      if (args.limit && args.limit > 100)
        throw new UserInputError(
          'Cannot return more than 100 items, please use pagination.'
        )
      const { commits, cursor } = await getCommitsByBranchId({
        branchId: parent.id,
        limit: args.limit,
        cursor: args.cursor
      })
      const totalCount = await getCommitsTotalCountByBranchId({ branchId: parent.id })

      return { items: commits, totalCount, cursor }
    }
  },
  Mutation: {
    async commitCreate(parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.commit.streamId,
        'stream:contributor'
      )

      if (
        !(await respectsLimits({ action: 'COMMIT_CREATE', source: context.userId }))
      ) {
        throw new Error('Blocked due to rate-limiting. Try again later')
      }

      const id = await createCommitByBranchName({
        ...args.commit,
        authorId: context.userId
      })
      if (id) {
        await addCommitCreatedActivity({
          commitId: id,
          streamId: args.commit.streamId,
          userId: context.userId,
          commit: args.commit,
          branchName: args.commit.branchName
        })
      }

      return id
    },

    async commitUpdate(parent, args, context) {
      const role = await authorizeResolver(
        context.userId,
        args.commit.streamId,
        'stream:contributor'
      )

      if (!args.commit.message && !args.commit.newBranchName)
        throw new UserInputError('Please provide a message and/or a new branch name.')

      const commit = await getCommitById({
        streamId: args.commit.streamId,
        id: args.commit.id
      })

      if (commit.authorId !== context.userId && role !== 'stream:owner')
        throw new ForbiddenError(
          'Only the author of a commit or a stream owner may update it.'
        )

      const updated = await updateCommit({ ...args.commit })

      if (updated) {
        await saveActivity({
          streamId: args.commit.streamId,
          resourceType: 'commit',
          resourceId: args.commit.id,
          actionType: ActionTypes.Commit.Update,
          userId: context.userId,
          info: { old: commit, new: args.commit },
          message: `Commit message changed: ${args.commit.id} (${args.commit.message})`
        })
        await pubsub.publish(COMMIT_UPDATED, {
          commitUpdated: { ...args.commit },
          streamId: args.commit.streamId,
          commitId: args.commit.id
        })
      }

      return updated
    },

    async commitReceive(parent, args, context) {
      await authorizeResolver(context.userId, args.input.streamId, 'stream:reviewer')

      await getCommitById({
        streamId: args.input.streamId,
        id: args.input.commitId
      })
      const user = await getUser(context.userId)

      await saveActivity({
        streamId: args.input.streamId,
        resourceType: 'commit',
        resourceId: args.input.commitId,
        actionType: ActionTypes.Commit.Receive,
        userId: context.userId,
        info: {
          sourceApplication: args.input.sourceApplication,
          message: args.input.message
        },
        message: `Commit ${args.input.commitId} was received by ${user.name}`
      })

      return true
    },

    async commitDelete(parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.commit.streamId,
        'stream:contributor'
      )

      const commit = await getCommitById({
        streamId: args.commit.streamId,
        id: args.commit.id
      })
      if (commit.authorId !== context.userId)
        throw new ForbiddenError('Only the author of a commit may delete it.')

      const deleted = await deleteCommit({ id: args.commit.id })
      if (deleted) {
        await saveActivity({
          streamId: args.commit.streamId,
          resourceType: 'commit',
          resourceId: args.commit.id,
          actionType: ActionTypes.Commit.Delete,
          userId: context.userId,
          info: { commit },
          message: `Commit deleted: ${args.commit.id}`
        })
        await pubsub.publish(COMMIT_DELETED, {
          commitDeleted: { ...args.commit },
          streamId: args.commit.streamId
        })
      }

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
