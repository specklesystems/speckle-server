'use strict'

const {
  ForbiddenError,
  UserInputError,
  ApolloError,
  withFilter
} = require('apollo-server-express')
const { authorizeResolver, pubsub } = require('@/modules/shared')
const { saveActivity } = require('@/modules/activitystream/services')

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

const { getStream } = require('../../services/streams')
const { getUser } = require('../../services/users')

const { respectsLimits } = require('../../services/ratelimits')

// subscription events
const COMMIT_CREATED = 'COMMIT_CREATED'
const COMMIT_UPDATED = 'COMMIT_UPDATED'
const COMMIT_DELETED = 'COMMIT_DELETED'

module.exports = {
  Query: {},
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
  User: {
    async commits(parent, args, context) {
      const publicOnly = context.userId !== parent.id
      const totalCount = await getCommitsTotalCountByUserId({ userId: parent.id })
      if (args.limit && args.limit > 100)
        throw new UserInputError(
          'Cannot return more than 100 items, please use pagination.'
        )
      const { commits: items, cursor } = await getCommitsByUserId({
        userId: parent.id,
        limit: args.limit,
        cursor: args.cursor,
        publicOnly
      })

      return { items, cursor, totalCount }
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
        await saveActivity({
          streamId: args.commit.streamId,
          resourceType: 'commit',
          resourceId: id,
          actionType: 'commit_create',
          userId: context.userId,
          info: { id, commit: args.commit },
          message: `Commit created on branch ${args.commit.branchName}: ${id} (${args.commit.message})`
        })
        await pubsub.publish(COMMIT_CREATED, {
          commitCreated: { ...args.commit, id, authorId: context.userId },
          streamId: args.commit.streamId
        })
      }

      return id
    },

    async commitUpdate(parent, args, context) {
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
        throw new ForbiddenError('Only the author of a commit may update it.')

      const updated = await updateCommit({ ...args.commit })
      if (updated) {
        await saveActivity({
          streamId: args.commit.streamId,
          resourceType: 'commit',
          resourceId: args.commit.id,
          actionType: 'commit_update',
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
      // if stream is private, check if the user has access to it
      const stream = await getStream({ streamId: args.input.streamId })

      if (!stream.public) {
        await authorizeResolver(context.userId, args.input.streamId, 'stream:reviewer')
      }

      await getCommitById({
        streamId: args.input.streamId,
        id: args.input.commitId
      })
      const user = await getUser(context.userId)

      await saveActivity({
        streamId: args.input.streamId,
        resourceType: 'commit',
        resourceId: args.input.commitId,
        actionType: 'commit_receive',
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
          actionType: 'commit_delete',
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
