'use strict'

import { AuthContext } from '@/modules/shared/authz'
import { UserInputError, ApolloError } from 'apollo-server-express'
import { withFilter } from 'graphql-subscriptions'
import {
  pubsub,
  CommitSubscriptions as CommitPubsubEvents
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
import { MaybeNullOrUndefined, Nullable, Roles } from '@speckle/shared'
import { StreamCommitsArgs } from '@/modules/core/graph/generated/graphql'
import {
  CommitReceivedInput,
  CommitUpdateInput,
  CommitsDeleteInput,
  CommitsMoveInput,
  DeleteVersionsInput,
  MoveVersionsInput
} from '@/test/graphql/generated/graphql'

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
const getUserCommits = async (
  publicOnly: boolean,
  userId: string,
  args: { limit: number; cursor: string }
) => {
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
export = {
  Query: {},
  Commit: {
    async stream(
      parent: { id: string },
      _args: never,
      ctx: {
        userId: string
        loaders: {
          commits: { getCommitStream: { load: (commitId: string) => { id: string } } }
        }
      }
    ) {
      const { id: commitId } = parent

      const stream = await ctx.loaders.commits.getCommitStream.load(commitId)
      if (!stream) {
        throw new StreamInvalidAccessError('Commit stream not found')
      }

      await validateStreamAccess(ctx.userId, stream.id)
      return stream
    },
    async streamId(
      parent: { id: string },
      _args: never,
      ctx: {
        loaders: {
          commits: { getCommitStream: { load: (commitId: string) => { id: string } } }
        }
      }
    ) {
      const { id: commitId } = parent
      const stream = await ctx.loaders.commits.getCommitStream.load(commitId)
      return stream?.id || null
    },
    async streamName(
      parent: { id: string },
      _args: never,
      ctx: {
        loaders: {
          commits: { getCommitStream: { load: (commitId: string) => { name: string } } }
        }
      }
    ) {
      const { id: commitId } = parent
      const stream = await ctx.loaders.commits.getCommitStream.load(commitId)
      return stream?.name || null
    },
    /**
     * The DB schema actually has the value under 'author', but some queries (not all)
     * remap it to 'authorId'
     */
    async authorId(parent: { authorId?: string; author?: string }) {
      return parent.authorId || parent.author || null
    },
    async authorName(
      parent: { authorId?: string; authorName?: string; author?: string },
      _args: never,
      ctx: {
        loaders: {
          users: {
            getUser: {
              load: (author: string) => { name: string }
            }
          }
        }
      }
    ) {
      const { authorId, authorName, author } = parent
      if (authorName) return authorName
      const authorQuery = authorId || author
      if (!authorQuery) return null
      const authorEntity = await ctx.loaders.users.getUser.load(authorQuery)
      return authorEntity?.name || null
    },
    async authorAvatar(
      parent: { authorId?: string; authorAvatar?: string; author?: string },
      _args: never,
      ctx: {
        loaders: {
          users: {
            getUser: {
              load: (author: string) => { avatar: string }
            }
          }
        }
      }
    ) {
      const { authorId, authorAvatar, author } = parent
      if (authorAvatar) return authorAvatar
      const authorQuery = authorId || author
      if (!authorQuery) return null

      const authorEntity = await ctx.loaders.users.getUser.load(authorQuery)
      return authorEntity?.avatar || null
    },
    async branchName(
      parent: { id: string },
      _args: never,
      ctx: {
        loaders: {
          commits: { getCommitBranch: { load: (commitId: string) => { name: string } } }
        }
      }
    ) {
      const { id } = parent
      return (await ctx.loaders.commits.getCommitBranch.load(id))?.name || null
    },
    async branch(
      parent: { id: string },
      _args: never,
      ctx: {
        loaders: {
          commits: { getCommitBranch: { load: (commitId: string) => { name: string } } }
        }
      }
    ) {
      const { id } = parent
      return await ctx.loaders.commits.getCommitBranch.load(id)
    }
  },
  Stream: {
    async commits(parent: { id: string }, args: StreamCommitsArgs) {
      return await getPaginatedStreamCommits(parent.id, args)
    },

    async commit(parent: { id: string }, args: { id?: string }) {
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
    async commits(parent: { id: string }, args: { limit: number; cursor: string }) {
      return await getUserCommits(true, parent.id, args)
    }
  },
  User: {
    async commits(
      parent: { id: string },
      args: { limit: number; cursor: string },
      context: AuthContext
    ) {
      return await getUserCommits(context.userId !== parent.id, parent.id, args)
    }
  },
  Branch: {
    async commits(parent: { id: string }, args: { limit: number; cursor?: string }) {
      return await getPaginatedBranchCommits({
        branchId: parent.id,
        limit: args.limit,
        cursor: args.cursor
      })
    }
  },
  Mutation: {
    async commitCreate(
      parent: never,
      args: {
        commit: {
          streamId: string
          branchName: string
          objectId: string
          authorId: string
          message: Nullable<string>
          sourceApplication: Nullable<string>
          totalChildrenCount?: MaybeNullOrUndefined<number>
          parents: Nullable<string[]>
        }
      },
      context: AuthContext
    ) {
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
        authorId: context.userId
      })

      return id
    },

    async commitUpdate(
      _parent: never,
      args: { commit: CommitUpdateInput },
      context: AuthContext
    ) {
      await authorizeResolver(
        context.userId,
        args.commit.streamId,
        Roles.Stream.Contributor
      )

      if (!context.userId) throw new Error('Invalid user id')

      await updateCommitAndNotify(args.commit, context.userId)
      return true
    },

    async commitReceive(
      parent: never,
      args: { input: CommitReceivedInput },
      context: AuthContext
    ) {
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

    async commitDelete(
      _parent: never,
      args: { commit: { id: string; streamId: string } },
      context: AuthContext
    ) {
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

    async commitsMove(
      _: never,
      args: { input: CommitsMoveInput | MoveVersionsInput },
      ctx: { userId: string }
    ) {
      await batchMoveCommits(args.input, ctx.userId)
      return true
    },

    async commitsDelete(
      _: never,
      args: { input: CommitsDeleteInput | DeleteVersionsInput },
      ctx: { userId: string }
    ) {
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
            Roles.Stream.Reviewer
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
      subscribe: withFilter(
        () => pubsub.asyncIterator([COMMIT_DELETED]),
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
}
