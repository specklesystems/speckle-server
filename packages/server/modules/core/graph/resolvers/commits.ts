'use strict'

import { UserInputError, ApolloError } from 'apollo-server-express'
import {
  CommitSubscriptions as CommitPubsubEvents,
  filteredSubscribe
} from '@/modules/shared/utils/subscriptions'
import { authorizeResolver } from '@/modules/shared'

import {
  getCommitById,
  getCommitsByUserId,
  getCommitsByStreamId,
  getCommitsTotalCountByUserId
} from '@/modules/core/services/commits'
import {
  getPaginatedStreamCommits,
  getPaginatedBranchCommits
} from '@/modules/core/services/commit/retrieval'
import {
  createCommitByBranchName,
  updateCommitAndNotify,
  deleteCommitAndNotify
} from '@/modules/core/services/commit/management'
import { addCommitReceivedActivity } from '@/modules/activitystream/services/commitActivity'

import { getUserById } from '@/modules/core/services/users'

import {
  isRateLimitBreached,
  getRateLimitResult,
  RateLimitAction
} from '@/modules/core/services/ratelimiter'
import { RateLimitError } from '@/modules/core/errors/ratelimit'
import {
  batchMoveCommits,
  batchDeleteCommits
} from '@/modules/core/services/commit/batchCommitActions'
import { validateStreamAccess } from '@/modules/core/services/streams/streamAccessService'
import { StreamInvalidAccessError } from '@/modules/core/errors/stream'
import { Roles } from '@speckle/shared'
import type {
  LimitedUserCommitsArgs,
  RequireFields,
  Resolvers
} from '@/modules/core/graph/generated/graphql'

// subscription events
const COMMIT_CREATED = CommitPubsubEvents.CommitCreated
const COMMIT_UPDATED = CommitPubsubEvents.CommitUpdated
const COMMIT_DELETED = CommitPubsubEvents.CommitDeleted

const getUserCommits = async (
  publicOnly: boolean,
  userId: string,
  args: RequireFields<LimitedUserCommitsArgs, 'limit'>
) => {
  const totalCount = await getCommitsTotalCountByUserId({ userId, publicOnly })
  if (args.limit && args.limit > 100)
    throw new UserInputError(
      'Cannot return more than 100 items, please use pagination.'
    )
  const { commits: items, cursor } = await getCommitsByUserId({
    userId,
    limit: args.limit,
    cursor: args.cursor || undefined,
    publicOnly
  })

  return { items, cursor, totalCount }
}

export = {
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
      return parent.authorId || parent.author || null
    },
    async authorName(parent, _args, ctx) {
      const { authorId, authorName, author } = parent
      if (authorName) return authorName
      const authorQuery = authorId || author
      if (!authorQuery) return null
      const authorEntity = await ctx.loaders.users.getUser.load(authorQuery)
      return authorEntity?.name || null
    },
    async authorAvatar(parent, _args, context) {
      const { authorId, authorAvatar, author } = parent
      if (authorAvatar) return authorAvatar
      const authorQuery = authorId || author
      if (!authorQuery) return null

      const authorEntity = await context.loaders.users.getUser.load(authorQuery)
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
    async commitCreate(_parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.commit.streamId,
        Roles.Stream.Contributor
      )

      if (!context.userId) throw new Error('Invalid user id')

      const rateLimitResult = await getRateLimitResult(
        RateLimitAction.COMMIT_CREATE,
        context.userId
      )
      if (isRateLimitBreached(rateLimitResult)) {
        throw new RateLimitError(rateLimitResult)
      }

      const { id } = await createCommitByBranchName({
        ...args.commit,
        parents: args.commit.parents ? args.commit.parents.map((p) => p || '') : null,
        message: args.commit.message || null,
        sourceApplication: args.commit.sourceApplication || null,
        authorId: context.userId
      })

      return id
    },

    async commitUpdate(_parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.commit.streamId,
        Roles.Stream.Contributor
      )

      if (!context.userId) throw new Error('Invalid user id')

      await updateCommitAndNotify(args.commit, context.userId)
      return true
    },

    async commitReceive(_parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.input.streamId,
        Roles.Stream.Reviewer
      )

      if (!context.userId) return false

      const commit = await getCommitById({
        streamId: args.input.streamId,
        id: args.input.commitId
      })
      const user = await getUserById({ userId: context.userId })

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
        Roles.Stream.Contributor
      )

      if (!context.userId) throw new Error('Invalid user id')

      const deleted = await deleteCommitAndNotify(
        args.commit.id,
        args.commit.streamId,
        context.userId
      )
      return deleted
    },

    async commitsMove(_parent, args, ctx) {
      await batchMoveCommits(args.input, ctx.userId!)
      return true
    },

    async commitsDelete(_parent, args, ctx) {
      await batchDeleteCommits(args.input, ctx.userId!)
      return true
    }
  },
  Subscription: {
    commitCreated: {
      subscribe: filteredSubscribe(
        COMMIT_CREATED,
        async (payload, variables, context) => {
          await authorizeResolver(
            context.userId,
            payload.streamId,
            Roles.Stream.Reviewer
          )
          return payload.streamId === variables.streamId
        }
      )
    },

    commitUpdated: {
      subscribe: filteredSubscribe(
        COMMIT_UPDATED,
        async (payload, variables, context) => {
          await authorizeResolver(
            context.userId,
            payload.streamId,
            Roles.Stream.Reviewer
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
      subscribe: filteredSubscribe(
        COMMIT_DELETED,
        async (payload, variables, context) => {
          await authorizeResolver(
            context.userId,
            payload.streamId,
            Roles.Stream.Reviewer
          )

          return payload.streamId === variables.streamId
        }
      )
    }
  }
} as Resolvers
