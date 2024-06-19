import { pubsub } from '@/modules/shared/utils/subscriptions'
import { ForbiddenError as ApolloForbiddenError } from 'apollo-server-express'
import { ForbiddenError } from '@/modules/shared/errors'
import { getStream } from '@/modules/core/services/streams'
import { Roles } from '@/modules/core/helpers/mainConstants'
import knexInstance from '@/db/knex'
import {
  createComment,
  createCommentReply,
  viewComment,
  archiveComment,
  editComment,
  streamResourceCheck
} from '@/modules/comments/services/index'
import {
  ensureCommentSchema
} from '@/modules/comments/services/commentTextService'
import { has } from 'lodash'
import {
  documentToBasicString
} from '@/modules/core/services/richTextEditorService'
import {
  getPaginatedCommitComments,
  getPaginatedBranchComments,
  getPaginatedProjectComments
} from '@/modules/comments/services/retrieval'
import {
  publish,
  ViewerSubscriptions,
  CommentSubscriptions,
  filteredSubscribe,
  ProjectSubscriptions
} from '@/modules/shared/utils/subscriptions'
import {
  addCommentCreatedActivity,
  addCommentArchivedActivity,
  addReplyAddedActivity
} from '@/modules/activitystream/services/commentActivity'
import {
  getViewerResourceItemsUngrouped,
  getViewerResourcesForComment,
  doViewerResourcesFit
} from '@/modules/core/services/commit/viewerResources'
import {
  authorizeProjectCommentsAccess,
  authorizeCommentAccess,
  markViewed,
  createCommentThreadAndNotify,
  createCommentReplyAndNotify,
  editCommentAndNotify,
  archiveCommentAndNotify
} from '@/modules/comments/services/management'
import {
  isLegacyData,
  isDataStruct,
  formatSerializedViewerState,
  convertStateToLegacyData,
  convertLegacyDataToState
} from '@/modules/comments/services/data'
import {
  Resolvers
} from '@/modules/core/graph/generated/graphql'
import {
  createCommentsRepository
} from '@/modules/comments/repositories/comments'
import { ResourceIdentifier, ResourceType } from '@/test/graphql/generated/graphql'

export = {
  Query: {
    async comment(_parent, args, context) {
      await authorizeProjectCommentsAccess({
        projectId: args.streamId,
        authCtx: context
      })

      const { getComment } = createCommentsRepository({ db: knexInstance })

      const comment = await getComment({ id: args.id, userId: context.userId })

      if (!comment || (comment.streamId !== args.streamId))
        throw new ApolloForbiddenError('You do not have access to this comment.')

      return comment
    },
    async comments(_parent, args, context) {
      await authorizeProjectCommentsAccess({
        projectId: args.streamId,
        authCtx: context
      })

      const { getComments } = createCommentsRepository({ db: knexInstance })

      // TODO: Double-check spread is necessary
      return { ...(await getComments({ ...args, userId: context.userId })) }
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

      const { getComments } = createCommentsRepository({ db: knexInstance })

      const resources: ResourceIdentifier[] = [{ resourceId: parent.id, resourceType: ResourceType.Comment }]

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
      return ensureCommentSchema(commentText)
    },
    rawText(parent) {
      const { doc } = ensureCommentSchema(parent.text || '')
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
      if (has(parent, 'resources')) return parent.resources
      return await ctx.loaders.comments.getResources.load(parent.id)
    },
    async viewedAt(parent, _args, ctx) {
      if (has(parent, 'viewedAt')) return parent.viewedAt
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
      const commentsRepository = createCommentsRepository({ db: knexInstance })
      return await getViewerResourcesForComment({ commentsRepository })(parent.streamId, parent.id)
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

      const commentsRepository = createCommentsRepository({ db: knexInstance })

      return await getPaginatedProjectComments({ commentsRepository })({
        ...args,
        projectId: parent.id,
        filter: {
          ...(args.filter || {}),
          allModelVersions: !args.filter?.loadedVersionsOnly,
          threadsOnly: true
        }
      })
    }
  },
  Version: {
    async commentThreads(parent, args, context) {
      const stream = await context.loaders.commits.getCommitStream.load(parent.id)

      if (!stream)
        throw new ApolloForbiddenError(`Could not authorize request for project ${parent.id}`)


      await authorizeProjectCommentsAccess({
        projectId: stream.id,
        authCtx: context
      })

      const commentsRepository = createCommentsRepository({ db: knexInstance })

      return await getPaginatedCommitComments({ commentsRepository })({
        ...args,
        commitId: parent.id,
      })
    }
  },
  Model: {
    async commentThreads(parent, args, context) {
      await authorizeProjectCommentsAccess({
        projectId: parent.streamId,
        authCtx: context
      })

      const commentsRepository = createCommentsRepository({ db: knexInstance })

      return await getPaginatedBranchComments({ commentsRepository })({
        ...args,
        branchId: parent.id
      })
    }
  },
  ViewerUserActivityMessage: {
    async user(parent, args, context) {
      const { userId } = parent

      if (!userId)
        throw new ApolloForbiddenError('You are not authorized.')

      return context.loaders.users.getUser.load(userId)
    }
  },
  Stream: {
    async commentCount(parent, _args, context) {
      if (context.role === Roles.Server.ArchivedUser)
        throw new ApolloForbiddenError('You are not authorized.')

      return await context.loaders.streams.getCommentThreadCount.load(parent.id)
    }
  },
  Commit: {
    async commentCount(parent, args, context) {
      if (context.role === Roles.Server.ArchivedUser)
        throw new ApolloForbiddenError('You are not authorized.')

      const { getResourceCommentCount } = createCommentsRepository({ db: knexInstance })

      return await getResourceCommentCount({ resourceId: parent.id })
    }
  },
  Object: {
    async commentCount(parent, args, context) {
      if (context.role === Roles.Server.ArchivedUser)
        throw new ApolloForbiddenError('You are not authorized.')

      const { getResourceCommentCount } = createCommentsRepository({ db: knexInstance })

      return await getResourceCommentCount({ resourceId: parent.id })
    }
  },
  CommentMutations: {
    async markViewed(_parent, args, ctx) {
      if (!ctx.userId)
        throw new ApolloForbiddenError('You are not authorized.')

      await authorizeCommentAccess({
        authCtx: ctx,
        commentId: args.commentId
      })

      const commentsRepository = createCommentsRepository({ db: knexInstance })

      await markViewed({ commentsRepository })(args.commentId, ctx.userId)

      return true
    },
    async create(_parent, args, ctx) {
      if (!ctx.userId)
        throw new ApolloForbiddenError('You are not authorized.')

      await authorizeProjectCommentsAccess({
        projectId: args.input.projectId,
        authCtx: ctx,
        requireProjectRole: true
      })

      const commentsRepository = createCommentsRepository({ db: knexInstance })

      return await createCommentThreadAndNotify({ commentsRepository })(args.input, ctx.userId)
    },
    async reply(_parent, args, ctx) {
      if (!ctx.userId)
        throw new ApolloForbiddenError('You are not authorized.')

      await authorizeCommentAccess({
        commentId: args.input.threadId,
        authCtx: ctx,
        requireProjectRole: true
      })

      const commentsRepository = createCommentsRepository({ db: knexInstance })

      return await createCommentReplyAndNotify({ commentsRepository })(args.input, ctx.userId)
    },
    async edit(_parent, args, ctx) {
      if (!ctx.userId)
        throw new ApolloForbiddenError('You are not authorized.')

      await authorizeCommentAccess({
        authCtx: ctx,
        commentId: args.input.commentId,
        requireProjectRole: true
      })

      const commentsRepository = createCommentsRepository({ db: knexInstance })

      return await editCommentAndNotify({ commentsRepository })(args.input, ctx.userId)
    },
    async archive(_parent, args, ctx) {
      if (!ctx.userId)
        throw new ApolloForbiddenError('You are not authorized.')

      await authorizeCommentAccess({
        authCtx: ctx,
        commentId: args.commentId,
        requireProjectRole: true
      })

      const commentsRepository = createCommentsRepository({ db: knexInstance })

      await archiveCommentAndNotify({ commentsRepository })(args.commentId, ctx.userId, args.archived)

      return true
    }
  },
  Mutation: {
    commentMutations: () => ({}),
    async broadcastViewerUserActivity(_parent, args, context) {
      if (!context.userId)
        throw new ApolloForbiddenError('You are not authorized.')

      await authorizeProjectCommentsAccess({
        projectId: args.projectId,
        authCtx: context
      })

      await publish(ViewerSubscriptions.UserActivityBroadcasted, {
        projectId: args.projectId,
        // TODO: Inject core module repository
        resourceItems: await getViewerResourceItemsUngrouped(args),
        viewerUserActivityBroadcasted: args.message,
        userId: context.userId
      })

      return true
    },

    async userViewerActivityBroadcast(parent, args, context) {
      await authorizeProjectCommentsAccess({
        projectId: args.streamId,
        authCtx: context
      })
      // const stream = await getStream({
      //   streamId: args.streamId,
      //   userId: context.userId
      // })
      // if (!stream) {
      //   throw new ApolloError('Stream not found')
      // }

      // if (!stream.isPublic && !context.auth) {
      //   return false
      // }
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

      // TODO: Inject core module repository
      const stream = await getStream({
        streamId: args.streamId,
        userId: context.userId
      })

      if (!stream || !stream.allowPublicComments && !stream.role)
        throw new ApolloForbiddenError('You are not authorized.')

      await pubsub.publish(CommentSubscriptions.CommentThreadActivity, {
        commentThreadActivity: { type: 'reply-typing-status', data: args.data },
        streamId: args.streamId,
        commentId: args.commentId
      })
      return true
    },

    async commentCreate(_parent, args, context) {
      if (!context.userId)
        throw new ApolloForbiddenError('Only registered users can comment.')

      // TODO: Inject core module repository
      const stream = await getStream({
        streamId: args.input.streamId,
        userId: context.userId
      })

      if (!stream || !stream.allowPublicComments && !stream.role)
        throw new ApolloForbiddenError('You are not authorized.')

      const commentsRepository = createCommentsRepository({ db: knexInstance })

      const comment = await createComment({ commentsRepository })({
        userId: context.userId,
        input: args.input
      })

      // TODO: Inject activitystream service
      await addCommentCreatedActivity({
        streamId: args.input.streamId,
        userId: context.userId,
        input: args.input,
        comment
      })

      return comment.id
    },

    async commentEdit(_parent, args, context) {
      // NOTE: This is NOT in use anywhere
      if (!context.userId)
        throw new ApolloForbiddenError('Only registered users can comment.')

      const stream = await authorizeProjectCommentsAccess({
        projectId: args.input.streamId,
        authCtx: context,
        requireProjectRole: true
      })
      const matchUser = !stream.role

      const commentsRepository = createCommentsRepository({ db: knexInstance })

      try {
        await editComment({ commentsRepository })({ userId: context.userId, input: args.input, matchUser })
        return true
      } catch (err) {
        if (err instanceof ForbiddenError) throw new ApolloForbiddenError(err.message)
        throw err
      }
    },

    // used for flagging a comment as viewed
    async commentView(_parent, args, context) {
      if (!context.userId)
        throw new ApolloForbiddenError('You are not authorized.')

      await authorizeProjectCommentsAccess({
        projectId: args.streamId,
        authCtx: context
      })

      const commentsRepository = createCommentsRepository({ db: knexInstance })

      await viewComment({ commentsRepository })({ userId: context.userId, commentId: args.commentId })

      return true
    },

    async commentArchive(_parent, args, context) {
      if (!context.userId)
        throw new ApolloForbiddenError('You are not authorized.')

      await authorizeProjectCommentsAccess({
        projectId: args.streamId,
        authCtx: context,
        requireProjectRole: true
      })

      const commentsRepository = createCommentsRepository({ db: knexInstance })

      let updatedComment
      try {
        updatedComment = await archiveComment({ commentsRepository })({ ...args, userId: context.userId }) // NOTE: permissions check inside service
      } catch (err) {
        if (err instanceof ForbiddenError) throw new ApolloForbiddenError(err.message)
        throw err
      }

      await addCommentArchivedActivity({
        streamId: args.streamId,
        commentId: args.commentId,
        userId: context.userId,
        input: args,
        comment: updatedComment
      })

      return true
    },

    async commentReply(_parent, args, context) {
      if (!context.userId)
        throw new ApolloForbiddenError('Only registered users can comment.')

      // TODO: Inject core repo/service method
      const stream = await getStream({
        streamId: args.input.streamId,
        userId: context.userId
      })

      if (!stream || !stream.allowPublicComments && !stream.role)
        throw new ApolloForbiddenError('You are not authorized.')

      const commentsRepository = createCommentsRepository({ db: knexInstance })

      const reply = await createCommentReply({ commentsRepository })({
        authorId: context.userId,
        parentCommentId: args.input.parentComment,
        streamId: args.input.streamId,
        text: args.input.text ?? null,
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

          if (!stream.allowPublicComments && !stream.role)
            throw new ApolloForbiddenError('You are not authorized.')

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

          if (!stream.allowPublicComments && !stream.role)
            throw new ApolloForbiddenError('You are not authorized.')

          // if we're listening for a stream's root comments events
          if (!variables.resourceIds) {
            return payload.streamId === variables.streamId
          }

          // otherwise perform a deeper check
          try {
            // prevents comment exfiltration by listening in to a auth'ed stream, but different commit ("stream hopping" for subscriptions)
            await streamResourceCheck({
              streamId: variables.streamId,
              resources: variables.resourceIds.map((resId) => {
                return {
                  resourceId: resId,
                  resourceType: resId.length === 10 ? 'commit' : 'object'
                }
              })
            })
            for (const res of variables.resourceIds) {
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
        }
      ),
    },
    commentThreadActivity: {
      subscribe: filteredSubscribe(
        CommentSubscriptions.CommentThreadActivity,
        async (payload, variables, context) => {
          const stream = await getStream({
            streamId: payload.streamId,
            userId: context.userId
          })

          if (!stream.allowPublicComments && !stream.role)
            throw new ApolloForbiddenError('You are not authorized.')

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

          if (!stream.isPublic && !stream.role)
            throw new ApolloForbiddenError('You are not authorized.')

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

          if (!(stream.isDiscoverable || stream.isPublic) && !stream.role)
            throw new ApolloForbiddenError('You are not authorized.')

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
