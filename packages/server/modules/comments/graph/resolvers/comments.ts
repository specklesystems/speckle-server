import { getPubSub } from '@/modules/shared/utils/subscriptions'
import { ForbiddenError } from '@/modules/shared/errors'
import { Roles } from '@/modules/core/helpers/mainConstants'
import {
  streamResourceCheckFactory,
  createCommentFactory,
  createCommentReplyFactory,
  editCommentFactory,
  archiveCommentFactory
} from '@/modules/comments/services/index'
import {
  checkStreamResourceAccessFactory,
  deleteCommentFactory,
  getCommentFactory,
  getCommentsLegacyFactory,
  getCommentsResourcesFactory,
  getPaginatedBranchCommentsPageFactory,
  getPaginatedBranchCommentsTotalCountFactory,
  getPaginatedCommitCommentsPageFactory,
  getPaginatedCommitCommentsTotalCountFactory,
  getPaginatedProjectCommentsPageFactory,
  getPaginatedProjectCommentsTotalCountFactory,
  getResourceCommentCountFactory,
  insertCommentLinksFactory,
  insertCommentsFactory,
  markCommentUpdatedFactory,
  markCommentViewedFactory,
  resolvePaginatedProjectCommentsLatestModelResourcesFactory,
  updateCommentFactory
} from '@/modules/comments/repositories/comments'
import {
  ensureCommentSchema,
  validateInputAttachmentsFactory
} from '@/modules/comments/services/commentTextService'
import { has } from 'lodash-es'
import type { SmartTextEditorValueSchema } from '@/modules/core/services/richTextEditorService'
import { documentToBasicString } from '@/modules/core/services/richTextEditorService'
import {
  getPaginatedBranchCommentsFactory,
  getPaginatedCommitCommentsFactory,
  getPaginatedProjectCommentsFactory
} from '@/modules/comments/services/retrieval'
import {
  publish,
  ViewerSubscriptions,
  CommentSubscriptions,
  filteredSubscribe,
  ProjectSubscriptions
} from '@/modules/shared/utils/subscriptions'
import {
  getViewerResourcesForCommentFactory,
  getViewerResourcesFromLegacyIdentifiersFactory,
  getViewerResourcesForCommentsFactory
} from '@/modules/core/services/commit/viewerResources'
import {
  createCommentThreadAndNotifyFactory,
  createCommentReplyAndNotifyFactory,
  editCommentAndNotifyFactory,
  archiveCommentAndNotifyFactory
} from '@/modules/comments/services/management'
import {
  isLegacyData,
  isDataStruct,
  formatSerializedViewerState,
  convertStateToLegacyData,
  convertLegacyDataToStateFactory
} from '@/modules/comments/services/data'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { ResourceType } from '@/modules/core/graph/generated/graphql'
import type { GraphQLContext } from '@/modules/shared/helpers/typeHelper'
import type { CommentRecord } from '@/modules/comments/helpers/types'
import { db, mainDb } from '@/db/knex'
import { getBlobsFactory } from '@/modules/blobstorage/repositories'
import type { ResourceIdentifier } from '@/modules/comments/domain/types'
import {
  getAllBranchCommitsFactory,
  getCommitsAndTheirBranchIdsFactory,
  getSpecificBranchCommitsFactory
} from '@/modules/core/repositories/commits'
import {
  getBranchesByIdsFactory,
  getBranchLatestCommitsFactory,
  getStreamBranchesByNameFactory
} from '@/modules/core/repositories/branches'
import { getStreamObjectsFactory } from '@/modules/core/repositories/objects'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import type { Knex } from 'knex'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { StreamNotFoundError } from '@/modules/core/errors/stream'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import { withOperationLogging } from '@/observability/domain/businessLogging'
import { isCreatedBeyondHistoryLimitCutoffFactory } from '@/modules/gatekeeperCore/utils/limits'
import {
  doViewerResourcesFit,
  getViewerResourceGroupsFactory,
  getViewerResourceItemsUngroupedFactory
} from '@/modules/viewer/services/viewerResources'
import type { RequestDataLoaders } from '@/modules/core/loaders'
import {
  getModelHomeSavedViewFactory,
  getSavedViewFactory
} from '@/modules/viewer/repositories/dataLoaders/savedViews'

// We can use the main DB for these
const getStream = getStreamFactory({ db })

const buildGetViewerResourcesFromLegacyIdentifiers = (deps: { db: Knex }) => {
  const getViewerResourcesFromLegacyIdentifiers =
    getViewerResourcesFromLegacyIdentifiersFactory({
      getViewerResourcesForComments: getViewerResourcesForCommentsFactory({
        getCommentsResources: getCommentsResourcesFactory(deps),
        getViewerResourcesFromLegacyIdentifiers: (...args) =>
          getViewerResourcesFromLegacyIdentifiers(...args) // recursive dep
      }),
      getCommitsAndTheirBranchIds: getCommitsAndTheirBranchIdsFactory(deps),
      getStreamObjects: getStreamObjectsFactory(deps)
    })
  return getViewerResourcesFromLegacyIdentifiers
}

const buildGetViewerResourceItemsUngrouped = (deps: {
  db: Knex
  loaders: RequestDataLoaders
}) =>
  getViewerResourceItemsUngroupedFactory({
    getViewerResourceGroups: getViewerResourceGroupsFactory({
      getStreamObjects: getStreamObjectsFactory(deps),
      getBranchLatestCommits: getBranchLatestCommitsFactory(deps),
      getStreamBranchesByName: getStreamBranchesByNameFactory(deps),
      getSpecificBranchCommits: getSpecificBranchCommitsFactory(deps),
      getAllBranchCommits: getAllBranchCommitsFactory(deps),
      getBranchesByIds: getBranchesByIdsFactory(deps),
      getSavedView: getSavedViewFactory(deps),
      getModelHomeSavedView: getModelHomeSavedViewFactory(deps)
    })
  })

const getAuthorizedStreamCommentFactory =
  (deps: { db: Knex; mainDb: Knex }) =>
  async (
    { streamId, commentId }: { streamId: string; commentId: string },
    ctx: GraphQLContext
  ) => {
    const canReadProject = await ctx.authPolicies.project.canRead({
      userId: ctx.userId,
      projectId: streamId
    })
    throwIfAuthNotOk(canReadProject)

    const getComment = getCommentFactory(deps)
    const comment = await getComment({ id: commentId, userId: ctx.userId })
    if (comment?.streamId !== streamId)
      throw new ForbiddenError('You do not have access to this comment.')

    return comment
  }

export default {
  Query: {
    async comment(_parent, args, context) {
      const projectId = args.streamId
      const projectDb = await getProjectDbClient({ projectId })
      const getStreamComment = getAuthorizedStreamCommentFactory({
        db: projectDb,
        mainDb
      })

      return await getStreamComment(
        { streamId: args.streamId, commentId: args.id },
        context
      )
    },

    async comments(_parent, args, context) {
      const projectId = args.streamId
      const canReadProject = await context.authPolicies.project.canRead({
        userId: context.userId,
        projectId
      })
      throwIfAuthNotOk(canReadProject)

      const projectDb = await getProjectDbClient({ projectId })
      const getComments = getCommentsLegacyFactory({ db: projectDb })
      return {
        ...(await getComments({
          ...args,
          resources: args.resources?.filter((res): res is ResourceIdentifier => !!res),
          userId: context.userId!
        }))
      }
    }
  },
  Comment: {
    async replies(parent, args, ctx) {
      const projectId = parent.streamId
      const projectDb = await getProjectDbClient({ projectId })

      // If limit=0, short-cut full execution and use data loader
      if (args.limit === 0) {
        return {
          totalCount: await ctx.loaders
            .forRegion({ db: projectDb })
            .comments.getReplyCount.load(parent.id),
          items: [],
          cursor: null
        }
      }

      const resources = [{ resourceId: parent.id, resourceType: ResourceType.Comment }]
      const getComments = getCommentsLegacyFactory({ db: projectDb })
      return await getComments({
        resources,
        replies: true,
        limit: args.limit,
        cursor: args.cursor
      })
    },
    /**
     * Format comment.text for output, since it can have multiple formats
     */
    async text(parent, _args, ctx) {
      const project = await ctx.loaders.streams.getStream.load(parent.streamId)

      if (!project) {
        throw new StreamNotFoundError('Project not found', {
          info: { streamId: parent.streamId }
        })
      }

      const isBeyondLimit = await isCreatedBeyondHistoryLimitCutoffFactory({ ctx })({
        entity: parent,
        limitType: 'commentHistory',
        project
      })
      // null is for out of limits
      if (isBeyondLimit) return null

      return {
        ...ensureCommentSchema(parent.text || ''),
        projectId: parent.streamId
      }
    },

    async rawText(parent, _args, ctx) {
      const project = await ctx.loaders.streams.getStream.load(parent.streamId)

      if (!project) {
        throw new StreamNotFoundError('Project not found', {
          info: { streamId: parent.streamId }
        })
      }

      const isBeyondLimit = await isCreatedBeyondHistoryLimitCutoffFactory({ ctx })({
        entity: parent,
        limitType: 'commentHistory',
        project
      })
      // null is for out of limits
      if (isBeyondLimit) return null

      const { doc } = ensureCommentSchema(parent.text || '')
      return documentToBasicString(doc)
    },
    async hasParent(parent) {
      return !!parent.parentComment
    },
    async parent(parent, _args, ctx) {
      const projectId = parent.streamId
      const projectDb = await getProjectDbClient({ projectId })

      return ctx.loaders
        .forRegion({ db: projectDb })
        .comments.getReplyParent.load(parent.id)
    },
    /**
     * Resolve resources, if they weren't already preloaded
     */
    async resources(parent, _args, ctx) {
      if (has(parent, 'resources'))
        return (parent as CommentRecord & { resources: ResourceIdentifier[] }).resources

      const projectId = parent.streamId
      const projectDb = await getProjectDbClient({ projectId })

      return await ctx.loaders
        .forRegion({ db: projectDb })
        .comments.getResources.load(parent.id)
    },
    async viewedAt(parent, _args, ctx) {
      if (has(parent, 'viewedAt'))
        return (parent as CommentRecord & { viewedAt: Date }).viewedAt

      const projectId = parent.streamId
      const projectDb = await getProjectDbClient({ projectId })

      return await ctx.loaders
        .forRegion({ db: projectDb })
        .comments.getViewedAt.load(parent.id)
    },
    async author(parent, _args, ctx) {
      return ctx.loaders.users.getUser.load(parent.authorId)
    },
    async replyAuthors(parent, args, ctx) {
      const projectId = parent.streamId
      const projectDb = await getProjectDbClient({ projectId })

      const authorIds = await ctx.loaders
        .forRegion({ db: projectDb })
        .comments.getReplyAuthorIds.load(parent.id)

      return {
        totalCount: authorIds.length,
        authorIds: authorIds.slice(0, args.limit || 25)
      }
    },
    async viewerResources(parent) {
      const projectId = parent.streamId
      const projectDb = await getProjectDbClient({ projectId })

      const getCommentsResources = getCommentsResourcesFactory({ db: projectDb })
      const getViewerResourcesFromLegacyIdentifiers =
        buildGetViewerResourcesFromLegacyIdentifiers({ db: projectDb })

      const getViewerResourcesForComment = getViewerResourcesForCommentFactory({
        getCommentsResources,
        getViewerResourcesFromLegacyIdentifiers
      })

      return await getViewerResourcesForComment(parent.streamId, parent.id)
    },
    /**
     * Until recently 'data' was just a JSONObject so theoretically it was possible to return all kinds of object
     * structures. So we need to guard against this and ensure we always return the correct thing.
     */
    async data(parent) {
      const parentData = parent.data
      if (!parentData) return null

      if (isLegacyData(parentData)) {
        return {
          location: parentData.location || {},
          camPos: parentData.camPos || [],
          sectionBox: parentData.sectionBox || null,
          selection: parentData.selection || null,
          filters: parentData.filters || {}
        }
      }

      if (isDataStruct(parentData)) {
        const formattedState = formatSerializedViewerState(parentData.state)
        return convertStateToLegacyData(formattedState)
      }

      return null
    },
    /**
     * SerializedViewerState
     */
    async viewerState(parent) {
      const projectId = parent.streamId
      const projectDb = await getProjectDbClient({ projectId })

      const parentData = parent.data
      if (!parentData) return null

      if (isDataStruct(parentData)) {
        const formattedState = formatSerializedViewerState(parentData.state)
        return formattedState
      }

      if (isLegacyData(parentData)) {
        const getViewerResourcesFromLegacyIdentifiers =
          buildGetViewerResourcesFromLegacyIdentifiers({ db: projectDb })
        const convertLegacyDataToState = convertLegacyDataToStateFactory({
          getViewerResourcesForComments: getViewerResourcesForCommentsFactory({
            getCommentsResources: getCommentsResourcesFactory({ db: projectDb }),
            getViewerResourcesFromLegacyIdentifiers
          })
        })

        return convertLegacyDataToState(parentData, parent)
      }

      return null
    }
  },
  CommentReplyAuthorCollection: {
    async items(parent, _args, ctx) {
      return await ctx.loaders.users.getUser.loadMany(parent.authorIds)
    }
  },
  Project: {
    async commentThreads(parent, args) {
      const projectDb = await getProjectDbClient({ projectId: parent.id })
      const getPaginatedProjectComments = getPaginatedProjectCommentsFactory({
        resolvePaginatedProjectCommentsLatestModelResources:
          resolvePaginatedProjectCommentsLatestModelResourcesFactory({ db: projectDb }),
        getPaginatedProjectCommentsPage: getPaginatedProjectCommentsPageFactory({
          db: projectDb
        }),
        getPaginatedProjectCommentsTotalCount:
          getPaginatedProjectCommentsTotalCountFactory({
            db: projectDb
          })
      })

      return await getPaginatedProjectComments({
        ...args,
        projectId: parent.id,
        filter: {
          ...(args.filter || {}),
          allModelVersions: !args.filter?.loadedVersionsOnly,
          threadsOnly: true
        }
      })
    },
    async comment(parent, args, context) {
      const projectId = parent.id
      const projectDb = await getProjectDbClient({ projectId })
      const getStreamComment = getAuthorizedStreamCommentFactory({
        db: projectDb,
        mainDb
      })
      return await getStreamComment(
        { streamId: parent.id, commentId: args.id },
        context
      )
    }
  },
  Version: {
    async commentThreads(parent, args) {
      const projectId = parent.streamId
      const projectDb = await getProjectDbClient({ projectId })
      const getPaginatedCommitComments = getPaginatedCommitCommentsFactory({
        getPaginatedCommitCommentsPage: getPaginatedCommitCommentsPageFactory({
          db: projectDb
        }),
        getPaginatedCommitCommentsTotalCount:
          getPaginatedCommitCommentsTotalCountFactory({
            db: projectDb
          })
      })

      return await getPaginatedCommitComments({
        ...args,
        commitId: parent.id,
        filter: {
          includeArchived: false,
          threadsOnly: true
        }
      })
    }
  },
  Model: {
    async commentThreads(parent, args) {
      const projectId = parent.streamId
      const projectDb = await getProjectDbClient({ projectId })

      const getPaginatedBranchComments = getPaginatedBranchCommentsFactory({
        getPaginatedBranchCommentsPage: getPaginatedBranchCommentsPageFactory({
          db: projectDb
        }),
        getPaginatedBranchCommentsTotalCount:
          getPaginatedBranchCommentsTotalCountFactory({
            db: projectDb
          })
      })

      return await getPaginatedBranchComments({
        ...args,
        branchId: parent.id,
        filter: {
          includeArchived: false,
          threadsOnly: true
        }
      })
    }
  },
  ViewerUserActivityMessage: {
    async user(parent, _args, context) {
      const { userId } = parent
      if (!userId) {
        return null
      }

      return context.loaders.users.getUser.load(userId)
    }
  },
  Stream: {
    async commentCount(parent, _args, context) {
      if (context.role === Roles.Server.ArchivedUser)
        throw new ForbiddenError('You are not authorized.')

      const projectId = parent.id
      const projectDb = await getProjectDbClient({ projectId })

      return await context.loaders
        .forRegion({ db: projectDb })
        .streams.getCommentThreadCount.load(parent.id)
    }
  },
  Commit: {
    async commentCount(parent, _args, context) {
      if (context.role === Roles.Server.ArchivedUser)
        throw new ForbiddenError('You are not authorized.')

      const projectId = parent.streamId
      const projectDb = await getProjectDbClient({ projectId })
      const getResourceCommentCount = getResourceCommentCountFactory({ db: projectDb })

      return await getResourceCommentCount({ resourceId: parent.id })
    }
  },
  Object: {
    async commentCount(parent, _args, context) {
      if (context.role === Roles.Server.ArchivedUser)
        throw new ForbiddenError('You are not authorized.')

      const projectId = parent.streamId
      const projectDb = await getProjectDbClient({ projectId })
      const getResourceCommentCount = getResourceCommentCountFactory({ db: projectDb })

      return await getResourceCommentCount({ resourceId: parent.id })
    }
  },
  CommentMutations: {
    async markViewed(_parent, args, ctx) {
      const canReadProject = await ctx.authPolicies.project.canRead({
        userId: ctx.userId,
        projectId: args.input.projectId
      })
      throwIfAuthNotOk(canReadProject)

      const projectDb = await getProjectDbClient({ projectId: args.input.projectId })
      const markCommentViewed = markCommentViewedFactory({ db: projectDb })
      await markCommentViewed(args.input.commentId, ctx.userId!)

      return true
    },
    async create(_parent, args, ctx) {
      const projectId = args.input.projectId
      const canCreate = await ctx.authPolicies.project.comment.canCreate({
        userId: ctx.userId,
        projectId
      })
      throwIfAuthNotOk(canCreate)

      const logger = ctx.log.child({
        projectId,
        streamId: projectId //legacy
      })

      const projectDb = await getProjectDbClient({ projectId })

      const getViewerResourceItemsUngrouped = buildGetViewerResourceItemsUngrouped({
        db: projectDb,
        loaders: ctx.loaders
      })

      const validateInputAttachments = validateInputAttachmentsFactory({
        getBlobs: getBlobsFactory({ db: projectDb })
      })
      const insertComments = insertCommentsFactory({ db: projectDb })
      const insertCommentLinks = insertCommentLinksFactory({ db: projectDb })
      const markCommentViewed = markCommentViewedFactory({ db: projectDb })

      const createCommentThreadAndNotify = createCommentThreadAndNotifyFactory({
        getViewerResourceItemsUngrouped,
        validateInputAttachments,
        insertComments,
        insertCommentLinks,
        markCommentViewed,
        emitEvent: getEventBus().emit
      })

      return await withOperationLogging(
        async () => await createCommentThreadAndNotify(args.input, ctx.userId!),
        {
          operationName: 'createCommentThread',
          operationDescription: 'Create comment thread',
          logger
        }
      )
    },
    async reply(_parent, args, ctx) {
      const projectId = args.input.projectId
      const canCreateComment = await ctx.authPolicies.project.comment.canCreate({
        userId: ctx.userId,
        projectId
      })
      throwIfAuthNotOk(canCreateComment)
      const logger = ctx.log.child({
        projectId,
        streamId: projectId //legacy
      })

      const projectDb = await getProjectDbClient({ projectId })
      const getComment = getCommentFactory({ db: projectDb })
      const validateInputAttachments = validateInputAttachmentsFactory({
        getBlobs: getBlobsFactory({ db: projectDb })
      })
      const insertComments = insertCommentsFactory({ db: projectDb })
      const insertCommentLinks = insertCommentLinksFactory({ db: projectDb })
      const getViewerResourcesFromLegacyIdentifiers =
        buildGetViewerResourcesFromLegacyIdentifiers({ db: projectDb })

      const createCommentReplyAndNotify = createCommentReplyAndNotifyFactory({
        getComment,
        validateInputAttachments,
        insertComments,
        insertCommentLinks,
        markCommentUpdated: markCommentUpdatedFactory({ db: projectDb }),
        emitEvent: getEventBus().emit,
        getViewerResourcesForComment: getViewerResourcesForCommentFactory({
          getCommentsResources: getCommentsResourcesFactory({ db: projectDb }),
          getViewerResourcesFromLegacyIdentifiers
        })
      })

      return await withOperationLogging(
        async () => await createCommentReplyAndNotify(args.input, ctx.userId!),
        {
          operationName: 'replyToComment',
          operationDescription: 'Reply to comment',
          logger
        }
      )
    },
    async edit(_parent, args, ctx) {
      const projectId = args.input.projectId
      const commentId = args.input.commentId
      const canEditComment = await ctx.authPolicies.project.comment.canEdit({
        projectId,
        userId: ctx.userId,
        commentId
      })
      throwIfAuthNotOk(canEditComment)

      const logger = ctx.log.child({
        projectId,
        streamId: projectId, //legacy
        commentId
      })

      const projectDb = await getProjectDbClient({
        projectId
      })
      const getComment = getCommentFactory({ db: projectDb })
      const validateInputAttachments = validateInputAttachmentsFactory({
        getBlobs: getBlobsFactory({ db: projectDb })
      })
      const updateComment = updateCommentFactory({ db: projectDb })

      const editCommentAndNotify = editCommentAndNotifyFactory({
        getComment,
        validateInputAttachments,
        updateComment,
        emitEvent: getEventBus().emit
      })

      return await withOperationLogging(
        async () => await editCommentAndNotify(args.input, ctx.userId!),
        { logger, operationName: 'editComment', operationDescription: 'Edit comment' }
      )
    },
    async archive(_parent, args, ctx) {
      const projectId = args.input.projectId
      const commentId = args.input.commentId
      const canArchive = await ctx.authPolicies.project.comment.canArchive({
        userId: ctx.userId,
        projectId,
        commentId
      })
      throwIfAuthNotOk(canArchive)
      const logger = ctx.log.child({
        projectId,
        streamId: projectId, //legacy
        commentId
      })

      const projectDb = await getProjectDbClient({
        projectId
      })
      const getComment = getCommentFactory({ db: projectDb })
      const getStream = getStreamFactory({ db: projectDb })
      const updateComment = updateCommentFactory({ db: projectDb })
      const getViewerResourcesFromLegacyIdentifiers =
        buildGetViewerResourcesFromLegacyIdentifiers({ db: projectDb })
      const getViewerResourcesForComment = getViewerResourcesForCommentFactory({
        getCommentsResources: getCommentsResourcesFactory({ db: projectDb }),
        getViewerResourcesFromLegacyIdentifiers
      })
      const archiveCommentAndNotify = archiveCommentAndNotifyFactory({
        getComment,
        getStream,
        updateComment,
        getViewerResourcesForComment,
        emitEvent: getEventBus().emit
      })

      await withOperationLogging(
        async () =>
          await archiveCommentAndNotify(commentId, ctx.userId!, args.input.archived),
        {
          logger,
          operationName: 'archiveComment',
          operationDescription: 'Archive comment'
        }
      )
      return true
    }
  },
  Mutation: {
    commentMutations: () => ({}),
    async broadcastViewerUserActivity(_parent, args, context) {
      const projectId = args.projectId
      const canBroadcastActivity =
        await context.authPolicies.project.canBroadcastActivity({
          projectId,
          userId: context.userId
        })
      throwIfAuthNotOk(canBroadcastActivity)

      const projectDb = await getProjectDbClient({ projectId })
      const getViewerResourceItemsUngrouped = buildGetViewerResourceItemsUngrouped({
        db: projectDb,
        loaders: context.loaders
      })

      await publish(ViewerSubscriptions.UserActivityBroadcasted, {
        projectId: args.projectId,
        resourceItems: await getViewerResourceItemsUngrouped(args),
        viewerUserActivityBroadcasted: {
          ...args.message,
          userId: context.userId!
        },
        userId: context.userId!
      })

      return true
    },

    async userViewerActivityBroadcast(_parent, args, context) {
      const projectId = args.streamId
      const canBroadcastActivity =
        await context.authPolicies.project.canBroadcastActivity({
          projectId,
          userId: context.userId
        })
      throwIfAuthNotOk(canBroadcastActivity)

      await getPubSub().publish(CommentSubscriptions.ViewerActivity, {
        userViewerActivity: args.data,
        streamId: args.streamId,
        resourceId: args.resourceId,
        authorId: context.userId
      })
      return true
    },
    async userCommentThreadActivityBroadcast(_parent, args, context) {
      if (!context.userId) return false

      const stream = await getStream({
        streamId: args.streamId,
        userId: context.userId
      })

      if (!stream?.allowPublicComments && !stream?.role)
        throw new ForbiddenError('You are not authorized.')

      await getPubSub().publish(CommentSubscriptions.CommentThreadActivity, {
        commentThreadActivity: { type: 'reply-typing-status', data: args.data },
        streamId: args.streamId,
        commentId: args.commentId
      })
      return true
    },

    async commentCreate(_parent, args, context) {
      const projectId = args.input.streamId
      const canCreate = await context.authPolicies.project.comment.canCreate({
        userId: context.userId,
        projectId
      })
      throwIfAuthNotOk(canCreate)

      const logger = context.log.child({
        projectId,
        streamId: projectId //legacy
      })

      const projectDb = await getProjectDbClient({ projectId })
      const getViewerResourcesFromLegacyIdentifiers =
        buildGetViewerResourcesFromLegacyIdentifiers({ db: projectDb })

      const createComment = createCommentFactory({
        checkStreamResourcesAccess: streamResourceCheckFactory({
          checkStreamResourceAccess: checkStreamResourceAccessFactory({ db: projectDb })
        }),
        validateInputAttachments: validateInputAttachmentsFactory({
          getBlobs: getBlobsFactory({ db: projectDb })
        }),
        insertComments: insertCommentsFactory({ db: projectDb }),
        insertCommentLinks: insertCommentLinksFactory({ db: projectDb }),
        deleteComment: deleteCommentFactory({ db: projectDb }),
        markCommentViewed: markCommentViewedFactory({ db: projectDb }),
        emitEvent: getEventBus().emit,
        getViewerResourcesFromLegacyIdentifiers
      })
      const comment = await withOperationLogging(
        async () =>
          await createComment({
            userId: context.userId!,
            input: args.input
          }),
        {
          operationName: 'createComment',
          operationDescription: 'Create comment',
          logger
        }
      )

      return comment.id
    },

    async commentEdit(_parent, args, context) {
      const projectId = args.input.streamId
      const commentId = args.input.id
      const canEdit = await context.authPolicies.project.comment.canEdit({
        userId: context.userId,
        projectId,
        commentId
      })
      throwIfAuthNotOk(canEdit)

      const logger = context.log.child({
        projectId,
        streamId: projectId, //legacy
        commentId
      })

      const projectDb = await getProjectDbClient({ projectId })
      const editComment = editCommentFactory({
        getComment: getCommentFactory({ db: projectDb }),
        validateInputAttachments: validateInputAttachmentsFactory({
          getBlobs: getBlobsFactory({ db: projectDb })
        }),
        updateComment: updateCommentFactory({ db: projectDb }),
        emitEvent: getEventBus().emit
      })

      await withOperationLogging(
        async () => await editComment({ userId: context.userId!, input: args.input }),
        { operationName: 'editComment', operationDescription: 'Edit comment', logger }
      )
      return true
    },

    // used for flagging a comment as viewed
    async commentView(_parent, args, context) {
      const canReadProject = await context.authPolicies.project.canRead({
        userId: context.userId,
        projectId: args.streamId
      })
      throwIfAuthNotOk(canReadProject)

      const projectDb = await getProjectDbClient({ projectId: args.streamId })
      const markCommentViewed = markCommentViewedFactory({ db: projectDb })

      await markCommentViewed(args.commentId, context.userId!)
      return true
    },

    async commentArchive(_parent, args, context) {
      const projectId = args.streamId
      const commentId = args.commentId
      const canArchive = await context.authPolicies.project.comment.canArchive({
        userId: context.userId,
        projectId,
        commentId
      })
      throwIfAuthNotOk(canArchive)

      const logger = context.log.child({
        projectId,
        streamId: projectId, //legacy
        commentId
      })

      const projectDb = await getProjectDbClient({ projectId })
      const archiveComment = archiveCommentFactory({
        getComment: getCommentFactory({ db: projectDb }),
        getStream,
        updateComment: updateCommentFactory({ db: projectDb }),
        emitEvent: getEventBus().emit
      })
      await withOperationLogging(
        async () => await archiveComment({ ...args, userId: context.userId! }), // NOTE: permissions check inside service
        {
          logger,
          operationName: 'archiveComment',
          operationDescription: 'Archive comment'
        }
      )

      return true
    },

    async commentReply(_parent, args, context) {
      const projectId = args.input.streamId
      if (!context.userId)
        throw new ForbiddenError('Only registered users can comment.')

      const logger = context.log.child({
        projectId,
        streamId: projectId //legacy
      })

      const stream = await getStream({
        streamId: projectId,
        userId: context.userId
      })

      if (!stream?.allowPublicComments && !stream?.role)
        throw new ForbiddenError('You are not authorized.')

      const projectDb = await getProjectDbClient({ projectId })

      const createCommentReply = createCommentReplyFactory({
        validateInputAttachments: validateInputAttachmentsFactory({
          getBlobs: getBlobsFactory({ db: projectDb })
        }),
        insertComments: insertCommentsFactory({ db: projectDb }),
        insertCommentLinks: insertCommentLinksFactory({ db: projectDb }),
        checkStreamResourcesAccess: streamResourceCheckFactory({
          checkStreamResourceAccess: checkStreamResourceAccessFactory({ db: projectDb })
        }),
        deleteComment: deleteCommentFactory({ db: projectDb }),
        markCommentUpdated: markCommentUpdatedFactory({ db: projectDb }),
        emitEvent: getEventBus().emit,
        getViewerResourcesForComment: getViewerResourcesForCommentFactory({
          getCommentsResources: getCommentsResourcesFactory({ db: projectDb }),
          getViewerResourcesFromLegacyIdentifiers:
            buildGetViewerResourcesFromLegacyIdentifiers({ db: projectDb })
        })
      })
      const reply = await withOperationLogging(
        async () =>
          await createCommentReply({
            authorId: context.userId!,
            parentCommentId: args.input.parentComment,
            streamId: args.input.streamId,
            text: args.input.text as SmartTextEditorValueSchema,
            data: args.input.data ?? null,
            blobIds: args.input.blobIds
          }),
        {
          logger,
          operationName: 'createCommentReply',
          operationDescription: 'Create comment reply'
        }
      )

      return reply.id
    }
  },
  Subscription: {
    userViewerActivity: {
      subscribe: filteredSubscribe(
        CommentSubscriptions.ViewerActivity,
        async (payload, variables, context) => {
          const canReadProject = await context.authPolicies.project.canRead({
            userId: context.userId,
            projectId: payload.streamId
          })
          throwIfAuthNotOk(canReadProject)

          // dont report user's activity to themselves
          if (context.userId && context.userId === payload.authorId) {
            return false
          }

          return (
            payload.streamId === variables.streamId &&
            payload.resourceId === variables.resourceId
          )
        }
      )
    },
    commentActivity: {
      subscribe: filteredSubscribe(
        CommentSubscriptions.CommentActivity,
        async (payload, variables, context) => {
          const canReadProject = await context.authPolicies.project.canRead({
            userId: context.userId,
            projectId: payload.streamId
          })
          throwIfAuthNotOk(canReadProject)

          // if we're listening for a stream's root comments events
          if (!variables.resourceIds) {
            return payload.streamId === variables.streamId
          }

          const projectDb = await getProjectDbClient({ projectId: payload.streamId })
          const streamResourceCheck = streamResourceCheckFactory({
            checkStreamResourceAccess: checkStreamResourceAccessFactory({
              db: projectDb
            })
          })

          // otherwise perform a deeper check
          try {
            // prevents comment exfiltration by listening in to a auth'ed stream, but different commit ("stream hopping" for subscriptions)
            await streamResourceCheck({
              streamId: variables.streamId,
              resources: variables.resourceIds
                .filter((resId): resId is string => !!resId)
                .map((resId) => {
                  return {
                    resourceId: resId,
                    resourceType:
                      resId.length === 10 ? ResourceType.Commit : ResourceType.Object
                  }
                })
            })
            for (const res of variables.resourceIds) {
              if (!res) continue
              if (
                payload.resourceIds.includes(res) &&
                payload.streamId === variables.streamId
              ) {
                return true
              }
            }
          } catch {
            return false
          }

          return false
        }
      )
    },
    commentThreadActivity: {
      subscribe: filteredSubscribe(
        CommentSubscriptions.CommentThreadActivity,
        async (payload, variables, context) => {
          const canReadProject = await context.authPolicies.project.canRead({
            userId: context.userId,
            projectId: payload.streamId
          })
          throwIfAuthNotOk(canReadProject)

          return (
            payload.streamId === variables.streamId &&
            payload.commentId === variables.commentId
          )
        }
      )
    },
    // new subscriptions:
    viewerUserActivityBroadcasted: {
      subscribe: filteredSubscribe(
        ViewerSubscriptions.UserActivityBroadcasted,
        async (payload, variables, context) => {
          const target = variables.target
          const sessionId = variables.sessionId

          if (!target.resourceIdString.trim().length) return false
          if (payload.projectId !== target.projectId) return false

          const canReadProject = await context.authPolicies.project.canRead({
            userId: context.userId,
            projectId: payload.projectId
          })
          throwIfAuthNotOk(canReadProject)

          const projectDb = await getProjectDbClient({ projectId: payload.projectId })
          const getViewerResourceItemsUngrouped = buildGetViewerResourceItemsUngrouped({
            db: projectDb,
            loaders: context.loaders
          })
          const requestedResourceItems = await getViewerResourceItemsUngrouped(target)

          // dont report users activity to himself
          if (
            sessionId &&
            sessionId === payload.viewerUserActivityBroadcasted.sessionId
          ) {
            return false
          }

          // Check if resources fit
          if (doViewerResourcesFit(requestedResourceItems, payload.resourceItems)) {
            return true
          }

          return false
        }
      )
    },
    projectCommentsUpdated: {
      subscribe: filteredSubscribe(
        ProjectSubscriptions.ProjectCommentsUpdated,
        async (payload, variables, context) => {
          const target = variables.target
          if (payload.projectId !== target.projectId) return false

          const canReadProject = await context.authPolicies.project.canRead({
            userId: context.userId,
            projectId: payload.projectId
          })
          throwIfAuthNotOk(canReadProject)

          const projectDb = await getProjectDbClient({ projectId: payload.projectId })
          const getViewerResourceItemsUngrouped = buildGetViewerResourceItemsUngrouped({
            db: projectDb,
            loaders: context.loaders
          })

          const requestedResourceItems = await getViewerResourceItemsUngrouped(target)

          if (!target.resourceIdString) {
            return true
          }

          // Check if resources fit
          if (doViewerResourcesFit(requestedResourceItems, payload.resourceItems)) {
            return true
          }

          return false
        }
      )
    }
  }
} as Resolvers
