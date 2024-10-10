const { CommitNotFoundError } = require('@/modules/core/errors/commit')
const { withFilter } = require('graphql-subscriptions')
const {
  pubsub,
  CommitSubscriptions: CommitPubsubEvents,
  publish
} = require('@/modules/shared/utils/subscriptions')
const { authorizeResolver } = require('@/modules/shared')

const {
  getCommitsByUserId,
  getCommitsByStreamId,
  getCommitsTotalCountByUserId
} = require('../../services/commits')
const {
  getPaginatedStreamCommits,
  getPaginatedBranchCommitsFactory
} = require('@/modules/core/services/commit/retrieval')
const {
  markCommitReceivedAndNotify,
  deleteCommitAndNotifyFactory,
  createCommitByBranchIdFactory,
  createCommitByBranchNameFactory,
  updateCommitAndNotifyFactory
} = require('@/modules/core/services/commit/management')

const { RateLimitError } = require('@/modules/core/errors/ratelimit')
const {
  isRateLimitBreached,
  getRateLimitResult
} = require('@/modules/core/services/ratelimiter')
const {
  batchDeleteCommits,
  batchMoveCommitsFactory
} = require('@/modules/core/services/commit/batchCommitActions')
const { StreamInvalidAccessError } = require('@/modules/core/errors/stream')
const { Roles } = require('@speckle/shared')
const { toProjectIdWhitelist } = require('@/modules/core/helpers/token')
const { BadRequestError } = require('@/modules/shared/errors')
const {
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
  moveCommitsToBranchFactory
} = require('@/modules/core/repositories/commits')
const { db } = require('@/db/knex')
const {
  markCommitStreamUpdated,
  getStreamFactory,
  getStreamsFactory,
  getCommitStreamFactory
} = require('@/modules/core/repositories/streams')
const {
  markCommitBranchUpdatedFactory,
  getBranchByIdFactory,
  getStreamBranchByNameFactory,
  createBranchFactory
} = require('@/modules/core/repositories/branches')
const {
  addCommitDeletedActivity,
  addCommitUpdatedActivity,
  addCommitMovedActivity,
  addCommitCreatedActivityFactory
} = require('@/modules/activitystream/services/commitActivity')
const { VersionsEmitter } = require('@/modules/core/events/versionsEmitter')
const { getObjectFactory } = require('@/modules/core/repositories/objects')
const {
  validateStreamAccessFactory
} = require('@/modules/core/services/streams/access')
const { saveActivityFactory } = require('@/modules/activitystream/repositories')

// subscription events
const COMMIT_CREATED = CommitPubsubEvents.CommitCreated
const COMMIT_UPDATED = CommitPubsubEvents.CommitUpdated
const COMMIT_DELETED = CommitPubsubEvents.CommitDeleted

const getCommitStream = getCommitStreamFactory({ db })
const getStream = getStreamFactory({ db })
const getStreams = getStreamsFactory({ db })
const deleteCommitAndNotify = deleteCommitAndNotifyFactory({
  getCommit: getCommitFactory({ db }),
  markCommitStreamUpdated,
  markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db }),
  deleteCommit: deleteCommitFactory({ db }),
  addCommitDeletedActivity
})

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

const createCommitByBranchName = createCommitByBranchNameFactory({
  createCommitByBranchId,
  getStreamBranchByName: getStreamBranchByNameFactory({ db }),
  getBranchById: getBranchByIdFactory({ db })
})

const updateCommitAndNotify = updateCommitAndNotifyFactory({
  getCommit: getCommitFactory({ db }),
  getStream,
  getCommitStream,
  getStreamBranchByName: getStreamBranchByNameFactory({ db }),
  getCommitBranch: getCommitBranchFactory({ db }),
  switchCommitBranch: switchCommitBranchFactory({ db }),
  updateCommit: updateCommitFactory({ db }),
  addCommitUpdatedActivity,
  markCommitStreamUpdated,
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
  addCommitMovedActivity
})
const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })

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
