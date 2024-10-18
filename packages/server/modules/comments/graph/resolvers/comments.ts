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
  addCommentArchivedActivity,
  addCommentCreatedActivityFactory,
  addReplyAddedActivity
} from '@/modules/activitystream/services/commentActivity'
import {
  doViewerResourcesFit,
  getViewerResourcesForCommentFactory,
  getViewerResourcesFromLegacyIdentifiersFactory,
  getViewerResourcesForCommentsFactory,
  getViewerResourceItemsUngroupedFactory,
  getViewerResourceGroupsFactory
} from '@/modules/core/services/commit/viewerResources'
import {
  authorizeProjectCommentsAccessFactory,
  authorizeCommentAccessFactory,
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
import { db } from '@/db/knex'
import { CommentsEmitter } from '@/modules/comments/events/emitter'
import { getBlobsFactory } from '@/modules/blobstorage/repositories'
import { ResourceIdentifier } from '@/modules/comments/domain/types'
import {
  getAllBranchCommitsFactory,
  getCommitsAndTheirBranchIdsFactory,
  getSpecificBranchCommitsFactory
} from '@/modules/core/repositories/commits'
import { adminOverrideEnabled } from '@/modules/shared/helpers/envHelper'
import {
  getBranchLatestCommitsFactory,
  getStreamBranchesByNameFactory
} from '@/modules/core/repositories/branches'
import { getStreamObjectsFactory } from '@/modules/core/repositories/objects'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { saveActivityFactory } from '@/modules/activitystream/repositories'

const getStream = getStreamFactory({ db })
const streamResourceCheck = streamResourceCheckFactory({
  checkStreamResourceAccess: checkStreamResourceAccessFactory({ db })
})
const markCommentViewed = markCommentViewedFactory({ db })
const validateInputAttachments = validateInputAttachmentsFactory({
  getBlobs: getBlobsFactory({ db })
})
const insertComments = insertCommentsFactory({ db })
const insertCommentLinks = insertCommentLinksFactory({ db })
const deleteComment = deleteCommentFactory({ db })
const createComment = createCommentFactory({
  checkStreamResourcesAccess: streamResourceCheck,
  validateInputAttachments,
  insertComments,
  insertCommentLinks,
  deleteComment,
  markCommentViewed,
  commentsEventsEmit: CommentsEmitter.emit
})
const createCommentReply = createCommentReplyFactory({
  validateInputAttachments,
  insertComments,
  insertCommentLinks,
  checkStreamResourcesAccess: streamResourceCheck,
  deleteComment,
  markCommentUpdated: markCommentUpdatedFactory({ db }),
  commentsEventsEmit: CommentsEmitter.emit
})
const getComment = getCommentFactory({ db })
const updateComment = updateCommentFactory({ db })
const editComment = editCommentFactory({
  getComment,
  validateInputAttachments,
  updateComment,
  commentsEventsEmit: CommentsEmitter.emit
})
const archiveComment = archiveCommentFactory({
  getComment,
  getStream,
  updateComment
})
const getResourceCommentCount = getResourceCommentCountFactory({ db })

const getStreamObjects = getStreamObjectsFactory({ db })
const getCommentsResources = getCommentsResourcesFactory({ db })
const getViewerResourcesFromLegacyIdentifiers =
  getViewerResourcesFromLegacyIdentifiersFactory({
    getViewerResourcesForComments: getViewerResourcesForCommentsFactory({
      getCommentsResources: getCommentsResourcesFactory({ db }),
      getViewerResourcesFromLegacyIdentifiers: (...args) =>
        getViewerResourcesFromLegacyIdentifiers(...args) // recursive dep
    }),
    getCommitsAndTheirBranchIds: getCommitsAndTheirBranchIdsFactory({ db }),
    getStreamObjects
  })

const getViewerResourcesForComment = getViewerResourcesForCommentFactory({
  getCommentsResources,
  getViewerResourcesFromLegacyIdentifiers
})
const convertLegacyDataToState = convertLegacyDataToStateFactory({
  getViewerResourcesForComments: getViewerResourcesForCommentsFactory({
    getCommentsResources,
    getViewerResourcesFromLegacyIdentifiers
  })
})

const authorizeProjectCommentsAccess = authorizeProjectCommentsAccessFactory({
  getStream,
  adminOverrideEnabled
})
const authorizeCommentAccess = authorizeCommentAccessFactory({
  getStream,
  adminOverrideEnabled,
  getComment
})

const getViewerResourceItemsUngrouped = getViewerResourceItemsUngroupedFactory({
  getViewerResourceGroups: getViewerResourceGroupsFactory({
    getStreamObjects,
    getBranchLatestCommits: getBranchLatestCommitsFactory({ db }),
    getStreamBranchesByName: getStreamBranchesByNameFactory({ db }),
    getSpecificBranchCommits: getSpecificBranchCommitsFactory({ db }),
    getAllBranchCommits: getAllBranchCommitsFactory({ db })
  })
})
const createCommentThreadAndNotify = createCommentThreadAndNotifyFactory({
  getViewerResourceItemsUngrouped,
  validateInputAttachments,
  insertComments,
  insertCommentLinks,
  markCommentViewed,
  commentsEventsEmit: CommentsEmitter.emit,
  addCommentCreatedActivity: addCommentCreatedActivityFactory({
    getViewerResourcesFromLegacyIdentifiers,
    getViewerResourceItemsUngrouped,
    saveActivity: saveActivityFactory({ db }),
    publish
  })
})
const createCommentReplyAndNotify = createCommentReplyAndNotifyFactory({
  getComment,
  validateInputAttachments,
  insertComments,
  insertCommentLinks,
  markCommentUpdated: markCommentUpdatedFactory({ db }),
  commentsEventsEmit: CommentsEmitter.emit,
  addReplyAddedActivity
})
const editCommentAndNotify = editCommentAndNotifyFactory({
  getComment,
  validateInputAttachments,
  updateComment,
  commentsEventsEmit: CommentsEmitter.emit
})
const archiveCommentAndNotify = archiveCommentAndNotifyFactory({
  getComment,
  getStream,
  updateComment,
  addCommentArchivedActivity
})
const getPaginatedCommitComments = getPaginatedCommitCommentsFactory({
  getPaginatedCommitCommentsPage: getPaginatedCommitCommentsPageFactory({ db }),
  getPaginatedCommitCommentsTotalCount: getPaginatedCommitCommentsTotalCountFactory({
    db
  })
})
const getPaginatedBranchComments = getPaginatedBranchCommentsFactory({
  getPaginatedBranchCommentsPage: getPaginatedBranchCommentsPageFactory({ db }),
  getPaginatedBranchCommentsTotalCount: getPaginatedBranchCommentsTotalCountFactory({
    db
  })
})
const getPaginatedProjectComments = getPaginatedProjectCommentsFactory({
  resolvePaginatedProjectCommentsLatestModelResources:
    resolvePaginatedProjectCommentsLatestModelResourcesFactory({ db }),
  getPaginatedProjectCommentsPage: getPaginatedProjectCommentsPageFactory({ db }),
  getPaginatedProjectCommentsTotalCount: getPaginatedProjectCommentsTotalCountFactory({
    db
  })
})

const getStreamComment = async (
  { streamId, commentId }: { streamId: string; commentId: string },
  ctx: GraphQLContext
) => {
  await authorizeProjectCommentsAccess({
    projectId: streamId,
    authCtx: ctx
  })

  const comment = await getComment({ id: commentId, userId: ctx.userId })
  if (comment?.streamId !== streamId)
    throw new ForbiddenError('You do not have access to this comment.')

  return comment
}

// FIXME: Non-null assertions considered unsafe but are parity with previous .js logic
export = {
  Query: {
    async comment(_parent, args, context) {
      return await getStreamComment(
        { streamId: args.streamId, commentId: args.id },
        context
      )
    },

    async comments(_parent, args, context) {
      await authorizeProjectCommentsAccess({
        projectId: args.streamId,
        authCtx: context
      })
      const getComments = getCommentsLegacyFactory({ db })
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
      // If limit=0, short-cut full execution and use data loader
      if (args.limit === 0) {
        return {
          totalCount: await ctx.loaders.comments.getReplyCount.load(parent.id),
          items: [],
          cursor: null
        }
      }

      const resources = [{ resourceId: parent.id, resourceType: ResourceType.Comment }]
      const getComments = getCommentsLegacyFactory({ db })
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
      return ensureCommentSchema(commentText as SmartTextEditorValueSchema)
    },

    rawText(parent) {
      const { doc } = ensureCommentSchema(
        (parent.text as SmartTextEditorValueSchema) || ''
      )
      return documentToBasicString(doc)
    },
    async hasParent(parent) {
      return !!parent.parentComment
    },
    async parent(parent, _args, ctx) {
      return ctx.loaders.comments.getReplyParent.load(parent.id)
    },
    /**
     * Resolve resources, if they weren't already preloaded
     */
    async resources(parent, _args, ctx) {
      if (has(parent, 'resources'))
        return (parent as CommentRecord & { resources: ResourceIdentifier[] }).resources
      return await ctx.loaders.comments.getResources.load(parent.id)
    },
    async viewedAt(parent, _args, ctx) {
      if (has(parent, 'viewedAt'))
        return (parent as CommentRecord & { viewedAt: Date }).viewedAt
      return await ctx.loaders.comments.getViewedAt.load(parent.id)
    },
    async author(parent, _args, ctx) {
      return ctx.loaders.users.getUser.load(parent.authorId)
    },
    async replyAuthors(parent, args, ctx) {
      const authorIds = await ctx.loaders.comments.getReplyAuthorIds.load(parent.id)
      return {
        totalCount: authorIds.length,
        authorIds: authorIds.slice(0, args.limit || 25)
      }
    },
    async viewerResources(parent) {
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
      const parentData = parent.data
      if (!parentData) return null

      if (isDataStruct(parentData)) {
        const formattedState = formatSerializedViewerState(parentData.state)
        return formattedState
      }

      if (isLegacyData(parentData)) {
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
    async commentThreads(parent, args, context) {
      await authorizeProjectCommentsAccess({
        projectId: parent.id,
        authCtx: context
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
      return await getStreamComment(
        { streamId: parent.id, commentId: args.id },
        context
      )
    }
  },
  Version: {
    async commentThreads(parent, args, context) {
      const stream = await context.loaders.commits.getCommitStream.load(parent.id)
      await authorizeProjectCommentsAccess({
        projectId: stream!.id,
        authCtx: context
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
    async commentThreads(parent, args, context) {
      await authorizeProjectCommentsAccess({
        projectId: parent.streamId,
        authCtx: context
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
    async user(parent, args, context) {
      const { userId } = parent
      return context.loaders.users.getUser.load(userId!)
    }
  },
  Stream: {
    async commentCount(parent, _args, context) {
      if (context.role === Roles.Server.ArchivedUser)
        throw new ForbiddenError('You are not authorized.')
      return await context.loaders.streams.getCommentThreadCount.load(parent.id)
    }
  },
  Commit: {
    async commentCount(parent, args, context) {
      if (context.role === Roles.Server.ArchivedUser)
        throw new ForbiddenError('You are not authorized.')
      return await getResourceCommentCount({ resourceId: parent.id })
    }
  },
  Object: {
    async commentCount(parent, args, context) {
      if (context.role === Roles.Server.ArchivedUser)
        throw new ForbiddenError('You are not authorized.')
      return await getResourceCommentCount({ resourceId: parent.id })
    }
  },
  CommentMutations: {
    async markViewed(_parent, args, ctx) {
      await authorizeCommentAccess({
        authCtx: ctx,
        commentId: args.commentId
      })
      await markCommentViewed(args.commentId, ctx.userId!)
      return true
    },
    async create(_parent, args, ctx) {
      await authorizeProjectCommentsAccess({
        projectId: args.input.projectId,
        authCtx: ctx,
        requireProjectRole: true
      })
      return await createCommentThreadAndNotify(args.input, ctx.userId!)
    },
    async reply(_parent, args, ctx) {
      await authorizeCommentAccess({
        commentId: args.input.threadId,
        authCtx: ctx,
        requireProjectRole: true
      })
      return await createCommentReplyAndNotify(args.input, ctx.userId!)
    },
    async edit(_parent, args, ctx) {
      await authorizeCommentAccess({
        authCtx: ctx,
        commentId: args.input.commentId,
        requireProjectRole: true
      })
      return await editCommentAndNotify(args.input, ctx.userId!)
    },
    async archive(_parent, args, ctx) {
      await authorizeCommentAccess({
        authCtx: ctx,
        commentId: args.commentId,
        requireProjectRole: true
      })
      await archiveCommentAndNotify(args.commentId, ctx.userId!, args.archived)
      return true
    }
  },
  Mutation: {
    commentMutations: () => ({}),
    async broadcastViewerUserActivity(_parent, args, context) {
      await authorizeProjectCommentsAccess({
        projectId: args.projectId,
        authCtx: context
      })

      await publish(ViewerSubscriptions.UserActivityBroadcasted, {
        projectId: args.projectId,
        resourceItems: await getViewerResourceItemsUngrouped(args),
        viewerUserActivityBroadcasted: args.message,
        userId: context.userId!
      })
      return true
    },

    async userViewerActivityBroadcast(parent, args, context) {
      await authorizeProjectCommentsAccess({
        projectId: args.streamId,
        authCtx: context
      })

      await pubsub.publish(CommentSubscriptions.ViewerActivity, {
        userViewerActivity: args.data,
        streamId: args.streamId,
        resourceId: args.resourceId,
        authorId: context.userId
      })
      return true
    },
    async userCommentThreadActivityBroadcast(parent, args, context) {
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

    async commentCreate(parent, args, context) {
      if (!context.userId)
        throw new ForbiddenError('Only registered users can comment.')

      const stream = await getStream({
        streamId: args.input.streamId,
        userId: context.userId
      })

      if (!stream?.allowPublicComments && !stream?.role)
        throw new ForbiddenError('You are not authorized.')

      const comment = await createComment({
        userId: context.userId,
        input: args.input
      })

      const getViewerResourceItemsUngrouped = getViewerResourceItemsUngroupedFactory({
        getViewerResourceGroups: getViewerResourceGroupsFactory({
          getStreamObjects,
          getBranchLatestCommits: getBranchLatestCommitsFactory({ db }),
          getStreamBranchesByName: getStreamBranchesByNameFactory({ db }),
          getSpecificBranchCommits: getSpecificBranchCommitsFactory({ db }),
          getAllBranchCommits: getAllBranchCommitsFactory({ db })
        })
      })
      const getViewerResourcesFromLegacyIdentifiers =
        getViewerResourcesFromLegacyIdentifiersFactory({
          getViewerResourcesForComments: getViewerResourcesForCommentsFactory({
            getCommentsResources: getCommentsResourcesFactory({ db }),
            getViewerResourcesFromLegacyIdentifiers: (...args) =>
              getViewerResourcesFromLegacyIdentifiers(...args) // recursive dep
          }),
          getCommitsAndTheirBranchIds: getCommitsAndTheirBranchIdsFactory({ db }),
          getStreamObjects
        })
      await addCommentCreatedActivityFactory({
        getViewerResourceItemsUngrouped,
        getViewerResourcesFromLegacyIdentifiers,
        saveActivity: saveActivityFactory({ db }),
        publish
      })({
        streamId: args.input.streamId,
        userId: context.userId,
        input: args.input,
        comment
      })

      return comment.id
    },

    async commentEdit(parent, args, context) {
      // NOTE: This is NOT in use anywhere
      const stream = await authorizeProjectCommentsAccess({
        projectId: args.input.streamId,
        authCtx: context,
        requireProjectRole: true
      })
      const matchUser = !stream.role
      await editComment({ userId: context.userId!, input: args.input, matchUser })
      return true
    },

    // used for flagging a comment as viewed
    async commentView(parent, args, context) {
      await authorizeProjectCommentsAccess({
        projectId: args.streamId,
        authCtx: context
      })
      await markCommentViewed(args.commentId, context.userId!)
      return true
    },

    async commentArchive(parent, args, context) {
      await authorizeProjectCommentsAccess({
        projectId: args.streamId,
        authCtx: context,
        requireProjectRole: true
      })

      const updatedComment = await archiveComment({ ...args, userId: context.userId! }) // NOTE: permissions check inside service

      await addCommentArchivedActivity({
        streamId: args.streamId,
        commentId: args.commentId,
        userId: context.userId!,
        input: args,
        comment: updatedComment
      })

      return true
    },

    async commentReply(parent, args, context) {
      if (!context.userId)
        throw new ForbiddenError('Only registered users can comment.')

      const stream = await getStream({
        streamId: args.input.streamId,
        userId: context.userId
      })

      if (!stream?.allowPublicComments && !stream?.role)
        throw new ForbiddenError('You are not authorized.')

      const reply = await createCommentReply({
        authorId: context.userId,
        parentCommentId: args.input.parentComment,
        streamId: args.input.streamId,
        text: args.input.text as SmartTextEditorValueSchema,
        data: args.input.data ?? null,
        blobIds: args.input.blobIds
      })

      await addReplyAddedActivity({
        streamId: args.input.streamId,
        input: args.input,
        reply,
        userId: context.userId
      })

      return reply.id
    }
  },
  Subscription: {
    userViewerActivity: {
      subscribe: filteredSubscribe(
        CommentSubscriptions.ViewerActivity,
        async (payload, variables, context) => {
          const stream = await getStream({
            streamId: payload.streamId,
            userId: context.userId
          })

          if (!stream?.allowPublicComments && !stream?.role)
            throw new ForbiddenError('You are not authorized.')

          // dont report users activity to himself
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
          const stream = await getStream({
            streamId: payload.streamId,
            userId: context.userId
          })

          if (!stream?.allowPublicComments && !stream?.role)
            throw new ForbiddenError('You are not authorized.')

          // if we're listening for a stream's root comments events
          if (!variables.resourceIds) {
            return payload.streamId === variables.streamId
          }

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
          const stream = await getStream({
            streamId: payload.streamId,
            userId: context.userId
          })

          if (!stream?.allowPublicComments && !stream?.role)
            throw new ForbiddenError('You are not authorized.')

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

          const [stream, requestedResourceItems] = await Promise.all([
            getStream({
              streamId: payload.projectId,
              userId: context.userId
            }),
            getViewerResourceItemsUngrouped(target)
          ])

          if (!stream?.isPublic && !stream?.role)
            throw new ForbiddenError('You are not authorized.')

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

          const [stream, requestedResourceItems] = await Promise.all([
            getStream({
              streamId: payload.projectId,
              userId: context.userId
            }),
            getViewerResourceItemsUngrouped(target)
          ])

          if (!(stream?.isDiscoverable || stream?.isPublic) && !stream?.role)
            throw new ForbiddenError('You are not authorized.')

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
