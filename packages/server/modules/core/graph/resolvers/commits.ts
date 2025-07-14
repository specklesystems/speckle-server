import { CommitNotFoundError } from '@/modules/core/errors/commit'
import {
  CommitSubscriptions,
  filteredSubscribe
} from '@/modules/shared/utils/subscriptions'
import { authorizeResolver } from '@/modules/shared'
import { Knex } from 'knex'

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
import { throwIfRateLimitedFactory } from '@/modules/core/utils/ratelimiter'
import {
  batchDeleteCommitsFactory,
  batchMoveCommitsFactory
} from '@/modules/core/services/commit/batchCommitActions'
import {
  StreamInvalidAccessError,
  StreamNotFoundError
} from '@/modules/core/errors/stream'
import {
  throwIfResourceAccessNotAllowed,
  toProjectIdWhitelist
} from '@/modules/core/helpers/token'
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
import { getObjectFactory } from '@/modules/core/repositories/objects'
import { validateStreamAccessFactory } from '@/modules/core/services/streams/access'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { CommitGraphQLReturn } from '@/modules/core/helpers/graphTypes'
import {
  getProjectDbClient,
  getRegisteredDbClients
} from '@/modules/multiregion/utils/dbSelector'
import { LegacyUserCommit } from '@/modules/core/domain/commits/types'
import coreModule from '@/modules/core'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { isRateLimiterEnabled } from '@/modules/shared/helpers/envHelper'
import { TokenResourceIdentifierType } from '@/modules/core/domain/tokens/types'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import { withOperationLogging } from '@/observability/domain/businessLogging'
import { isNonNullable, MaybeNullOrUndefined, Roles } from '@speckle/shared'
import { getProjectLimitDateFactory } from '@/modules/gatekeeperCore/utils/limits'

const getStreams = getStreamsFactory({ db })

const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })

const getAuthorId = (commit: CommitGraphQLReturn) => {
  if ('author' in commit) return commit.author
  return commit.authorId
}

const getUserCommitsFactory =
  ({ db }: { db: Knex }) =>
  async (
    publicOnly: boolean,
    userId: string,
    args: { limit: number; cursor?: MaybeNullOrUndefined<string> },
    streamIdWhitelist?: string[]
  ) => {
    const getCommitsTotalCountByUserId = legacyGetPaginatedUserCommitsTotalCount({ db })
    const totalCount = await getCommitsTotalCountByUserId({
      userId,
      publicOnly,
      streamIdWhitelist
    })
    if (args.limit && args.limit > 100)
      throw new BadRequestError(
        'Cannot return more than 100 items, please use pagination.'
      )
    const getCommitsByUserId = legacyGetPaginatedUserCommitsPage({ db })
    const { commits: items, cursor } = await getCommitsByUserId({
      userId,
      limit: args.limit,
      cursor: args.cursor,
      publicOnly,
      streamIdWhitelist
    })

    return { items, cursor, totalCount }
  }

const throwIfRateLimited = throwIfRateLimitedFactory({
  rateLimiterEnabled: isRateLimiterEnabled()
})

export default {
  Query: {},
  Commit: {
    async stream(parent, _args, ctx) {
      const { id: commitId } = parent

      const projectDB = await getProjectDbClient({ projectId: parent.streamId })
      const stream = await ctx.loaders
        .forRegion({ db: projectDB })
        .commits.getCommitStream.load(commitId)
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
      const projectDB = await getProjectDbClient({ projectId: parent.streamId })
      const stream = await ctx.loaders
        .forRegion({ db: projectDB })
        .commits.getCommitStream.load(commitId)
      return stream?.id || null
    },
    async streamName(parent, _args, ctx) {
      const { id: commitId } = parent
      const projectDB = await getProjectDbClient({ projectId: parent.streamId })
      const stream = await ctx.loaders
        .forRegion({ db: projectDB })
        .commits.getCommitStream.load(commitId)
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
      const projectDB = await getProjectDbClient({ projectId: parent.streamId })
      return (
        (
          await ctx.loaders
            .forRegion({ db: projectDB })
            .commits.getCommitBranch.load(id)
        )?.name || null
      )
    },
    async branch(parent, _args, ctx) {
      const { id } = parent
      const projectDB = await getProjectDbClient({ projectId: parent.streamId })
      return await ctx.loaders
        .forRegion({ db: projectDB })
        .commits.getCommitBranch.load(id)
    }
  },
  Stream: {
    async commits(parent, args, ctx) {
      const projectDB = await getProjectDbClient({ projectId: parent.id })

      const limitsDate = await getProjectLimitDateFactory({ ctx })({
        limitType: 'versionsHistory',
        project: parent
      })

      const getCommitsByStreamId = legacyGetPaginatedStreamCommitsPageFactory({
        db: projectDB,
        limitsDate
      })
      const getPaginatedStreamCommits = legacyGetPaginatedStreamCommitsFactory({
        legacyGetPaginatedStreamCommitsPage: getCommitsByStreamId,
        getStreamCommitCount: getStreamCommitCountFactory({ db: projectDB })
      })
      return await getPaginatedStreamCommits(parent.id, args)
    },

    async commit(parent, args, ctx) {
      const projectDB = await getProjectDbClient({ projectId: parent.id })
      if (!args.id) {
        const getCommitsByStreamId = legacyGetPaginatedStreamCommitsPageFactory({
          db: projectDB
        })
        const { commits } = await getCommitsByStreamId({
          streamId: parent.id,
          limit: 1
        })
        if (commits.length !== 0) return commits[0]
        throw new CommitNotFoundError(
          'Cannot retrieve commit (there are no commits in this stream).'
        )
      }
      const c = await ctx.loaders
        .forRegion({ db: projectDB })
        .streams.getStreamCommit.forStream(parent.id)
        .load(args.id)
      return c
    }
  },
  LimitedUser: {
    async commits(parent, args, ctx) {
      // this function is not optimized but it is deprecated
      // DUI 2 only uses the totalCount
      const { cursor } = args
      let result: {
        items: LegacyUserCommit[]
        totalCount: number
        cursor?: string | null
      } = {
        cursor,
        items: [],
        totalCount: 0
      }
      const regionClients = await getRegisteredDbClients()
      for (const client of [db, ...regionClients]) {
        const getUserCommits = getUserCommitsFactory({ db: client })
        const { items, totalCount, cursor } = await getUserCommits(
          true,
          parent.id,
          args,
          toProjectIdWhitelist(ctx.resourceAccessRules)
        )

        result = {
          items: [...result.items, ...items],
          totalCount: result.totalCount + totalCount,
          cursor: cursor ?? result.cursor // this is a bad approximation but this is not used and will be deprecated soon
        }
      }
      return result
    }
  },
  User: {
    async commits(parent, args, context) {
      // this function is not optimized but it is deprecated
      // DUI 2 only uses the totalCount
      const { cursor } = args
      let result: {
        items: LegacyUserCommit[]
        totalCount: number
        cursor?: string | null
      } = {
        cursor,
        items: [],
        totalCount: 0
      }
      const regionClients = await getRegisteredDbClients()
      for (const client of [db, ...regionClients]) {
        const getUserCommits = getUserCommitsFactory({ db: client })
        const { items, totalCount, cursor } = await getUserCommits(
          context.userId !== parent.id,
          parent.id,
          args,
          toProjectIdWhitelist(context.resourceAccessRules)
        )

        result = {
          items: [...result.items, ...items],
          totalCount: result.totalCount + totalCount,
          cursor: cursor ?? result.cursor // this is a bad approximation but this is not used and will be deprecated soon
        }
      }
      return result
    }
  },
  Branch: {
    async commits(parent, args, ctx) {
      const projectDB = await getProjectDbClient({ projectId: parent.streamId })

      // If limit=0 & no filter, short-cut full execution and use data loader
      if (args.limit === 0) {
        return {
          totalCount: await ctx.loaders
            .forRegion({ db: projectDB })
            .branches.getCommitCount.load(parent.id),
          items: [],
          cursor: null
        }
      }

      const project = await ctx.loaders.streams.getStream.load(parent.streamId)
      if (!project) {
        throw new StreamNotFoundError('Project not found', {
          info: { streamId: parent.streamId }
        })
      }

      const limitsDate = await getProjectLimitDateFactory({ ctx })({
        limitType: 'versionsHistory',
        project
      })

      const getPaginatedBranchCommits = getPaginatedBranchCommitsFactory({
        getSpecificBranchCommits: getSpecificBranchCommitsFactory({ db: projectDB }),
        getPaginatedBranchCommitsItems: getPaginatedBranchCommitsItemsFactory({
          db: projectDB,
          limitsDate
        }),
        getBranchCommitsTotalCount: getBranchCommitsTotalCountFactory({ db: projectDB })
      })

      return await getPaginatedBranchCommits({
        branchId: parent.id,
        limit: args.limit,
        cursor: args.cursor
      })
    }
  },
  Mutation: {
    async commitCreate(_parent, args, context) {
      await throwIfRateLimited({
        action: 'COMMIT_CREATE',
        source: context.userId!
      })

      const projectId = args.commit.streamId
      const modelName = args.commit.branchName
      const logger = context.log.child({
        projectId,
        streamId: projectId, //legacy
        modelName,
        branchName: modelName //legacy
      })

      throwIfResourceAccessNotAllowed({
        resourceId: args.commit.streamId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: context.resourceAccessRules
      })
      const canCreate = await context.authPolicies.project.version.canCreate({
        userId: context.userId,
        projectId
      })
      throwIfAuthNotOk(canCreate)

      await coreModule.executeHooks('onCreateVersionRequest', {
        projectId
      })

      const projectDb = await getProjectDbClient({ projectId })

      const createCommitByBranchId = createCommitByBranchIdFactory({
        createCommit: createCommitFactory({ db: projectDb }),
        getObject: getObjectFactory({ db: projectDb }),
        getBranchById: getBranchByIdFactory({ db: projectDb }),
        insertStreamCommits: insertStreamCommitsFactory({ db: projectDb }),
        insertBranchCommits: insertBranchCommitsFactory({ db: projectDb }),
        markCommitStreamUpdated: markCommitStreamUpdatedFactory({ db: projectDb }),
        markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db: projectDb }),
        emitEvent: getEventBus().emit
      })

      const createCommitByBranchName = createCommitByBranchNameFactory({
        createCommitByBranchId,
        getStreamBranchByName: getStreamBranchByNameFactory({ db: projectDb }),
        getBranchById: getBranchByIdFactory({ db: projectDb })
      })

      const { id } = await withOperationLogging(
        async () =>
          await createCommitByBranchName({
            ...args.commit,
            parents: args.commit.parents?.filter(isNonNullable),
            authorId: context.userId!
          }),
        {
          logger,
          operationName: 'createCommit',
          operationDescription: `Create a new Commit`
        }
      )

      return id
    },

    async commitUpdate(_parent, args, context) {
      const projectId = args.commit.streamId
      const commitId = args.commit.id
      throwIfResourceAccessNotAllowed({
        resourceId: args.commit.streamId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: context.resourceAccessRules
      })

      const logger = context.log.child({
        projectId,
        streamId: projectId, //legacy
        commitId
      })

      const canUpdate = await context.authPolicies.project.version.canUpdate({
        userId: context.userId,
        projectId: args.commit.streamId,
        versionId: args.commit.id
      })
      throwIfAuthNotOk(canUpdate)

      const projectDb = await getProjectDbClient({ projectId: args.commit.streamId })
      const updateCommitAndNotify = updateCommitAndNotifyFactory({
        getCommit: getCommitFactory({ db: projectDb }),
        getStream: getStreamFactory({ db }),
        getCommitStream: getCommitStreamFactory({ db: projectDb }),
        getStreamBranchByName: getStreamBranchByNameFactory({ db: projectDb }),
        getCommitBranch: getCommitBranchFactory({ db: projectDb }),
        switchCommitBranch: switchCommitBranchFactory({ db: projectDb }),
        updateCommit: updateCommitFactory({ db: projectDb }),
        emitEvent: getEventBus().emit,
        markCommitStreamUpdated: markCommitStreamUpdatedFactory({ db: projectDb }),
        markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db: projectDb })
      })
      await withOperationLogging(
        async () => await updateCommitAndNotify(args.commit, context.userId!),
        {
          logger,
          operationName: 'updateCommit',
          operationDescription: `Update a Commit`
        }
      )
      return true
    },

    async commitReceive(_parent, args, context) {
      const projectId = args.input.streamId
      const versionId = args.input.commitId
      throwIfResourceAccessNotAllowed({
        resourceId: args.input.streamId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: context.resourceAccessRules
      })

      const logger = context.log.child({
        projectId,
        streamId: projectId, //legacy,
        versionId,
        commitId: versionId //legacy
      })

      const canReceive = await context.authPolicies.project.version.canReceive({
        userId: context.userId,
        projectId
      })
      throwIfAuthNotOk(canReceive)

      const projectDb = await getProjectDbClient({ projectId })
      await withOperationLogging(
        async () =>
          await markCommitReceivedAndNotifyFactory({
            getCommit: getCommitFactory({ db: projectDb }),
            emitEvent: getEventBus().emit
          })({
            input: args.input,
            userId: context.userId!
          }),
        {
          logger,
          operationName: 'receiveCommit',
          operationDescription: `Receive a Commit`
        }
      )

      return true
    },

    async commitDelete(_parent, args, context) {
      const projectId = args.commit.streamId
      const versionId = args.commit.id
      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: context.resourceAccessRules
      })

      const logger = context.log.child({
        projectId,
        streamId: projectId, //legacy
        versionId,
        commitId: versionId //legacy
      })

      const canUpdate = await context.authPolicies.project.version.canUpdate({
        userId: context.userId,
        projectId,
        versionId
      })
      throwIfAuthNotOk(canUpdate)

      const projectDb = await getProjectDbClient({ projectId })
      const deleteCommitAndNotify = deleteCommitAndNotifyFactory({
        getCommit: getCommitFactory({ db: projectDb }),
        markCommitStreamUpdated: markCommitStreamUpdatedFactory({ db: projectDb }),
        markCommitBranchUpdated: markCommitBranchUpdatedFactory({ db: projectDb }),
        deleteCommit: deleteCommitFactory({ db: projectDb }),
        emitEvent: getEventBus().emit
      })
      const deleted = await withOperationLogging(
        async () =>
          await deleteCommitAndNotify(args.commit.id, projectId, context.userId!),
        {
          logger,
          operationName: 'deleteCommit',
          operationDescription: 'Delete a Commit'
        }
      )
      return deleted
    },

    // Not used by connectors
    async commitsMove(_, args, ctx) {
      const projectId = args.input.streamId

      throwIfResourceAccessNotAllowed({
        resourceId: args.input.streamId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: ctx.resourceAccessRules
      })

      const logger = ctx.log.child({
        projectId,
        streamId: projectId //legacy
      })

      const canUpdateAll = await Promise.all(
        args.input.commitIds.map(async (versionId) =>
          ctx.authPolicies.project.version.canUpdate({
            userId: ctx.userId,
            projectId: args.input.streamId,
            versionId
          })
        )
      )
      canUpdateAll.forEach((result) => {
        throwIfAuthNotOk(result)
      })

      const projectDb = await getProjectDbClient({ projectId: args.input.streamId })
      const batchMoveCommits = batchMoveCommitsFactory({
        getCommits: getCommitsFactory({ db: projectDb }),
        getStreams,
        getStreamBranchByName: getStreamBranchByNameFactory({ db: projectDb }),
        createBranch: createBranchFactory({ db: projectDb }),
        moveCommitsToBranch: moveCommitsToBranchFactory({ db: projectDb }),
        emitEvent: getEventBus().emit
      })
      await withOperationLogging(
        async () => await batchMoveCommits(args.input, ctx.userId!),
        {
          logger,
          operationName: 'moveCommits',
          operationDescription: 'Move one or more commits'
        }
      )
      return true
    },

    // Not used by connectors
    async commitsDelete(_, args, ctx) {
      const projectId = args.input.streamId
      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: ctx.resourceAccessRules
      })

      const logger = ctx.log.child({
        projectId,
        streamId: projectId //legacy
      })

      const canUpdateAll = await Promise.all(
        args.input.commitIds.map(async (versionId) =>
          ctx.authPolicies.project.version.canUpdate({
            userId: ctx.userId,
            projectId,
            versionId
          })
        )
      )
      canUpdateAll.forEach((result) => {
        throwIfAuthNotOk(result)
      })

      const projectDb = await getProjectDbClient({ projectId })
      const batchDeleteCommits = batchDeleteCommitsFactory({
        getCommits: getCommitsFactory({ db: projectDb }),
        getStreams,
        deleteCommits: deleteCommitsFactory({ db: projectDb }),
        emitEvent: getEventBus().emit
      })
      await withOperationLogging(
        async () => await batchDeleteCommits(args.input, ctx.userId!),
        {
          logger,
          operationName: 'deleteCommits',
          operationDescription: 'Delete one or more commits'
        }
      )
      return true
    }
  },
  Subscription: {
    commitCreated: {
      subscribe: filteredSubscribe(
        CommitSubscriptions.CommitCreated,
        async (payload, variables, context) => {
          throwIfResourceAccessNotAllowed({
            resourceId: payload.streamId,
            resourceType: TokenResourceIdentifierType.Project,
            resourceAccessRules: context.resourceAccessRules
          })
          const canReadProject = await context.authPolicies.project.canRead({
            userId: context.userId,
            projectId: payload.streamId
          })
          throwIfAuthNotOk(canReadProject)

          return payload.streamId === variables.streamId
        }
      )
    },
    commitUpdated: {
      subscribe: filteredSubscribe(
        CommitSubscriptions.CommitUpdated,
        async (payload, variables, context) => {
          throwIfResourceAccessNotAllowed({
            resourceId: payload.streamId,
            resourceType: TokenResourceIdentifierType.Project,
            resourceAccessRules: context.resourceAccessRules
          })
          const canReadProject = await context.authPolicies.project.canRead({
            userId: context.userId,
            projectId: payload.streamId
          })
          throwIfAuthNotOk(canReadProject)

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
          throwIfResourceAccessNotAllowed({
            resourceId: payload.streamId,
            resourceType: TokenResourceIdentifierType.Project,
            resourceAccessRules: context.resourceAccessRules
          })
          const canReadProject = await context.authPolicies.project.canRead({
            userId: context.userId,
            projectId: payload.streamId
          })
          throwIfAuthNotOk(canReadProject)

          return payload.streamId === variables.streamId
        }
      )
    }
  }
} as Resolvers
