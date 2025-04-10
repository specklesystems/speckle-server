import { pubsub } from '@/modules/shared/utils/subscriptions'
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
import { has } from 'lodash'
import {
  documentToBasicString,
  SmartTextEditorValueSchema
} from '@/modules/core/services/richTextEditorService'
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
  doViewerResourcesFit,
  getViewerResourcesForCommentFactory,
  getViewerResourcesFromLegacyIdentifiersFactory,
  getViewerResourcesForCommentsFactory,
  getViewerResourceItemsUngroupedFactory,
  getViewerResourceGroupsFactory
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
import { Resolvers, ResourceType } from '@/modules/core/graph/generated/graphql'
import { GraphQLContext } from '@/modules/shared/helpers/typeHelper'
import { CommentRecord } from '@/modules/comments/helpers/types'
import { db, mainDb } from '@/db/knex'
import { getBlobsFactory } from '@/modules/blobstorage/repositories'
import { ResourceIdentifier } from '@/modules/comments/domain/types'
import {
  getAllBranchCommitsFactory,
  getCommitsAndTheirBranchIdsFactory,
  getSpecificBranchCommitsFactory
} from '@/modules/core/repositories/commits'
import {
  getBranchLatestCommitsFactory,
  getStreamBranchesByNameFactory
} from '@/modules/core/repositories/branches'
import { getStreamObjectsFactory } from '@/modules/core/repositories/objects'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { Knex } from 'knex'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'

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

const buildGetViewerResourceItemsUngrouped = (deps: { db: Knex }) =>
  getViewerResourceItemsUngroupedFactory({
    getViewerResourceGroups: getViewerResourceGroupsFactory({
      getStreamObjects: getStreamObjectsFactory(deps),
      getBranchLatestCommits: getBranchLatestCommitsFactory(deps),
      getStreamBranchesByName: getStreamBranchesByNameFactory(deps),
      getSpecificBranchCommits: getSpecificBranchCommitsFactory(deps),
      getAllBranchCommits: getAllBranchCommitsFactory(deps)
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

export = {
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
    text(parent) {
      const commentText = parent?.text || ''
      return {
        ...ensureCommentSchema(commentText),
        projectId: parent.streamId
      }
    },

    rawText(parent) {
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
      return context.loaders.users.getUser.load(userId!)
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

      const projectDb = await getProjectDbClient({ projectId })

      const getViewerResourceItemsUngrouped = buildGetViewerResourceItemsUngrouped({
        db: projectDb
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

      return await createCommentThreadAndNotify(args.input, ctx.userId!)
    },
    async reply(_parent, args, ctx) {
      const canCreateComment = await ctx.authPolicies.project.comment.canCreate({
        userId: ctx.userId,
        projectId: args.input.projectId
      })
      throwIfAuthNotOk(canCreateComment)

      const projectDb = await getProjectDbClient({ projectId: args.input.projectId })
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

      return await createCommentReplyAndNotify(args.input, ctx.userId!)
    },
    async edit(_parent, args, ctx) {
      const canEditComment = await ctx.authPolicies.project.comment.canEdit({
        projectId: args.input.projectId,
        userId: ctx.userId,
        commentId: args.input.commentId
      })
      throwIfAuthNotOk(canEditComment)

      const projectDb = await getProjectDbClient({
        projectId: args.input.projectId
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

      return await editCommentAndNotify(args.input, ctx.userId!)
    },
    async archive(_parent, args, ctx) {
      const canArchive = await ctx.authPolicies.project.comment.canArchive({
        userId: ctx.userId,
        projectId: args.input.projectId,
        commentId: args.input.commentId
      })
      throwIfAuthNotOk(canArchive)

      const projectDb = await getProjectDbClient({
        projectId: args.input.projectId
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

      await archiveCommentAndNotify(
        args.input.commentId,
        ctx.userId!,
        args.input.archived
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
        db: projectDb
      })

      await publish(ViewerSubscriptions.UserActivityBroadcasted, {
        projectId: args.projectId,
        resourceItems: await getViewerResourceItemsUngrouped(args),
        viewerUserActivityBroadcasted: args.message,
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

      await pubsub.publish(CommentSubscriptions.ViewerActivity, {
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

      await pubsub.publish(CommentSubscriptions.CommentThreadActivity, {
        commentThreadActivity: { type: 'reply-typing-status', data: args.data },
        streamId: args.streamId,
        commentId: args.commentId
      })
      return true
    },

    async commentCreate(_parent, args, context) {
      const canCreate = await context.authPolicies.project.comment.canCreate({
        userId: context.userId,
        projectId: args.input.streamId
      })
      throwIfAuthNotOk(canCreate)

      const projectDb = await getProjectDbClient({ projectId: args.input.streamId })
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
      const comment = await createComment({
        userId: context.userId!,
        input: args.input
      })

      return comment.id
    },

    async commentEdit(_parent, args, context) {
      const canEdit = await context.authPolicies.project.comment.canEdit({
        userId: context.userId,
        projectId: args.input.streamId,
        commentId: args.input.id
      })
      throwIfAuthNotOk(canEdit)

      const projectDb = await getProjectDbClient({ projectId: args.input.streamId })
      const editComment = editCommentFactory({
        getComment: getCommentFactory({ db: projectDb }),
        validateInputAttachments: validateInputAttachmentsFactory({
          getBlobs: getBlobsFactory({ db: projectDb })
        }),
        updateComment: updateCommentFactory({ db: projectDb }),
        emitEvent: getEventBus().emit
      })

      await editComment({ userId: context.userId!, input: args.input })
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
      const canArchive = await context.authPolicies.project.comment.canArchive({
        userId: context.userId,
        projectId: args.streamId,
        commentId: args.commentId
      })
      throwIfAuthNotOk(canArchive)

      const projectDb = await getProjectDbClient({ projectId: args.streamId })
      const archiveComment = archiveCommentFactory({
        getComment: getCommentFactory({ db: projectDb }),
        getStream,
        updateComment: updateCommentFactory({ db: projectDb }),
        emitEvent: getEventBus().emit
      })
      await archiveComment({ ...args, userId: context.userId! }) // NOTE: permissions check inside service

      return true
    },

    async commentReply(_parent, args, context) {
      if (!context.userId)
        throw new ForbiddenError('Only registered users can comment.')

      const stream = await getStream({
        streamId: args.input.streamId,
        userId: context.userId
      })

      if (!stream?.allowPublicComments && !stream?.role)
        throw new ForbiddenError('You are not authorized.')

      const projectDb = await getProjectDbClient({ projectId: args.input.streamId })

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
      const reply = await createCommentReply({
        authorId: context.userId,
        parentCommentId: args.input.parentComment,
        streamId: args.input.streamId,
        text: args.input.text as SmartTextEditorValueSchema,
        data: args.input.data ?? null,
        blobIds: args.input.blobIds
      })

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
            db: projectDb
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
            db: projectDb
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
