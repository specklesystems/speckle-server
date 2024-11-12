import { CommitNotFoundError } from '@/modules/core/errors/commit'
import {
  CommitSubscriptions,
  filteredSubscribe,
  publish
} from '@/modules/shared/utils/subscriptions'
import { authorizeResolver } from '@/modules/shared'

import {
  getPaginatedBranchCommitsFactory,
  legacyGetPaginatedStreamCommitsFactory
} from '@/modules/core/services/commit/retrieval'
import {
  markCommitReceivedAndNotifyFactory,
  deleteCommitAndNotifyFactory,
  createCommitByBranchIdFactory,
  createCommitByBranchNameFactory,
  updateCommitAndNotifyFactory
} from '@/modules/core/services/commit/management'

import { RateLimitError } from '@/modules/core/errors/ratelimit'
import {
  isRateLimitBreached,
  getRateLimitResult
} from '@/modules/core/services/ratelimiter'
import {
  batchDeleteCommitsFactory,
  batchMoveCommitsFactory
} from '@/modules/core/services/commit/batchCommitActions'
import { StreamInvalidAccessError } from '@/modules/core/errors/stream'
import { isNonNullable, MaybeNullOrUndefined, Roles } from '@speckle/shared'
import { toProjectIdWhitelist } from '@/modules/core/helpers/token'
import { BadRequestError } from '@/modules/shared/errors'
import {
  getCommitFactory,
  deleteCommitFactory,
  createCommitFactory,
  insertStreamCommitsFactory,
  insertBranchCommitsFactory,
  getCommitBranchFactory,
  switchCommitBranchFactory,
  updateCommitFactory,
  getSpecificBranchCommitsFactory,
  getPaginatedBranchCommitsItemsFactory,
  getBranchCommitsTotalCountFactory,
  getCommitsFactory,
  moveCommitsToBranchFactory,
  legacyGetPaginatedUserCommitsPage,
  legacyGetPaginatedUserCommitsTotalCount,
  legacyGetPaginatedStreamCommitsPageFactory,
  getStreamCommitCountFactory,
  deleteCommitsFactory
} from '@/modules/core/repositories/commits'
import { db } from '@/db/knex'
import {
  getStreamFactory,
  getStreamsFactory,
  getCommitStreamFactory,
  markCommitStreamUpdatedFactory
} from '@/modules/core/repositories/streams'
import {
  markCommitBranchUpdatedFactory,
  getBranchByIdFactory,
  getStreamBranchByNameFactory,
  createBranchFactory
} from '@/modules/core/repositories/branches'
import {
  addCommitCreatedActivityFactory,
  addCommitUpdatedActivityFactory,
  addCommitMovedActivityFactory,
  addCommitDeletedActivityFactory
} from '@/modules/activitystream/services/commitActivity'
import { VersionsEmitter } from '@/modules/core/events/versionsEmitter'
import { getObjectFactory } from '@/modules/core/repositories/objects'
import { validateStreamAccessFactory } from '@/modules/core/services/streams/access'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { CommitGraphQLReturn } from '@/modules/core/helpers/graphTypes'
import { getProjectDbClient } from '@/modules/multiregion/dbSelector'

const getCommitStream = getCommitStreamFactory({ db })
const getStream = getStreamFactory({ db })
const getStreams = getStreamsFactory({ db })
const deleteCommitAndNotify = deleteCommitAndNotifyFactory({
  getCommit: getCommitFactory({ db }),
  markCommitStreamUpdated: markCommitStreamUpdatedFactory({ db }),
  markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db }),
  deleteCommit: deleteCommitFactory({ db }),
  addCommitDeletedActivity: addCommitDeletedActivityFactory({
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
  markCommitStreamUpdated: markCommitStreamUpdatedFactory({ db }),
  markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db })
})

const getPaginatedBranchCommits = getPaginatedBranchCommitsFactory({
  getSpecificBranchCommits: getSpecificBranchCommitsFactory({ db }),
  getPaginatedBranchCommitsItems: getPaginatedBranchCommitsItemsFactory({ db }),
  getBranchCommitsTotalCount: getBranchCommitsTotalCountFactory({ db })
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
const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })
const getCommitsByUserId = legacyGetPaginatedUserCommitsPage({ db })
const getCommitsTotalCountByUserId = legacyGetPaginatedUserCommitsTotalCount({ db })
const getCommitsByStreamId = legacyGetPaginatedStreamCommitsPageFactory({ db })
const getPaginatedStreamCommits = legacyGetPaginatedStreamCommitsFactory({
  legacyGetPaginatedStreamCommitsPage: getCommitsByStreamId,
  getStreamCommitCount: getStreamCommitCountFactory({ db })
})
const batchDeleteCommits = batchDeleteCommitsFactory({
  getCommits: getCommitsFactory({ db }),
  getStreams,
  deleteCommits: deleteCommitsFactory({ db }),
  addCommitDeletedActivity: addCommitDeletedActivityFactory({
    saveActivity: saveActivityFactory({ db }),
    publish
  })
})

const getAuthorId = (commit: CommitGraphQLReturn) => {
  if ('author' in commit) return commit.author
  return commit.authorId
}

const getUserCommits = async (
  publicOnly: boolean,
  userId: string,
  args: { limit: number; cursor?: MaybeNullOrUndefined<string> },
  streamIdWhitelist?: string[]
) => {
  const totalCount = await getCommitsTotalCountByUserId({
    userId,
    publicOnly,
    streamIdWhitelist
  })
  if (args.limit && args.limit > 100)
    throw new BadRequestError(
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

export = {
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
      return getAuthorId(parent)
    },
    async authorName(parent, _args, ctx) {
      if ('authorName' in parent) return parent.authorName

      const finalAuthorId = getAuthorId(parent)
      if (!finalAuthorId) return null
      const authorEntity = await ctx.loaders.users.getUser.load(finalAuthorId)
      return authorEntity?.name || null
    },
    async authorAvatar(parent, _args, ctx) {
      if ('authorAvatar' in parent) return parent.authorAvatar

      const finalAuthorId = getAuthorId(parent)
      if (!finalAuthorId) return null

      const authorEntity = await ctx.loaders.users.getUser.load(finalAuthorId)
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

    async commit(parent, args, ctx) {
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
      const c = await ctx.loaders.streams.getStreamCommit
        .forStream(parent.id)
        .load(args.id)
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
    async commitCreate(_parent, args, context) {
      const projectDb = await getProjectDbClient({ projectId: args.commit.streamId })
      await authorizeResolver(
        context.userId,
        args.commit.streamId,
        Roles.Stream.Contributor,
        context.resourceAccessRules
      )

      const rateLimitResult = await getRateLimitResult('COMMIT_CREATE', context.userId!)
      if (isRateLimitBreached(rateLimitResult)) {
        throw new RateLimitError(rateLimitResult)
      }

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

      const createCommitByBranchName = createCommitByBranchNameFactory({
        createCommitByBranchId,
        getStreamBranchByName: getStreamBranchByNameFactory({ db: projectDb }),
        getBranchById: getBranchByIdFactory({ db: projectDb })
      })

      const { id } = await createCommitByBranchName({
        ...args.commit,
        parents: args.commit.parents?.filter(isNonNullable),
        authorId: context.userId!
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

      await updateCommitAndNotify(args.commit, context.userId!)
      return true
    },

    async commitReceive(_parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.input.streamId,
        Roles.Stream.Reviewer,
        context.resourceAccessRules
      )

      await markCommitReceivedAndNotifyFactory({
        getCommit: getCommitFactory({ db }),
        saveActivity: saveActivityFactory({ db })
      })({
        input: args.input,
        userId: context.userId!
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
        context.userId!
      )
      return deleted
    },

    async commitsMove(_, args, ctx) {
      await batchMoveCommits(args.input, ctx.userId!)
      return true
    },

    async commitsDelete(_, args, ctx) {
      await batchDeleteCommits(args.input, ctx.userId!)
      return true
    }
  },
  Subscription: {
    commitCreated: {
      subscribe: filteredSubscribe(
        CommitSubscriptions.CommitCreated,
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
      subscribe: filteredSubscribe(
        CommitSubscriptions.CommitUpdated,
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
      subscribe: filteredSubscribe(
        CommitSubscriptions.CommitDeleted,
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
} as Resolvers
