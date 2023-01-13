const { pubsub } = require('@/modules/shared')
const {
  ForbiddenError: ApolloForbiddenError,
  ApolloError
} = require('apollo-server-express')
const { ForbiddenError } = require('@/modules/shared/errors')
const { getStream } = require('@/modules/core/services/streams')
const { Roles } = require('@/modules/core/helpers/mainConstants')
const { saveActivity } = require('@/modules/activitystream/services')
const { ActionTypes } = require('@/modules/activitystream/helpers/types')

const {
  getComment,
  getComments,
  getResourceCommentCount,
  createComment,
  createCommentReply,
  viewComment,
  archiveComment,
  editComment,
  streamResourceCheck
} = require('@/modules/comments/services/index')
const {
  ensureCommentSchema
} = require('@/modules/comments/services/commentTextService')
const { withFilter } = require('graphql-subscriptions')
const { has } = require('lodash')
const {
  documentToBasicString
} = require('@/modules/core/services/richTextEditorService')
const {
  getPaginatedCommitComments,
  getPaginatedBranchComments,
  getPaginatedProjectComments
} = require('@/modules/comments/services/retrieval')

const authorizeStreamAccess = async ({
  streamId,
  userId,
  serverRole,
  auth,
  requireRole = false
}) => {
  if (serverRole === Roles.Server.ArchivedUser)
    throw new ApolloForbiddenError('You are not authorized.')
  const stream = await getStream({ streamId, userId })
  if (!stream) throw new ApolloError('Stream not found')

  let authZed = true

  if (!stream.isPublic && auth === false) authZed = false

  if (!stream.isPublic && !stream.role) authZed = false

  if (stream.isPublic && requireRole && !stream.allowPublicComments && !stream.role)
    authZed = false

  if (!authZed) throw new ApolloForbiddenError('You are not authorized.')
  return stream
}

/** @type {import('@/modules/core/graph/generated/graphql').Resolvers} */
module.exports = {
  Query: {
    async comment(parent, args, context) {
      await authorizeStreamAccess({
        streamId: args.streamId,
        userId: context.userId,
        serverRole: context.role,
        auth: context.auth
      })
      const comment = await getComment({ id: args.id, userId: context.userId })
      if (comment.streamId !== args.streamId)
        throw new ApolloForbiddenError('You do not have access to this comment.')
      return comment
    },

    async comments(parent, args, context) {
      await authorizeStreamAccess({
        streamId: args.streamId,
        userId: context.userId,
        serverRole: context.role,
        auth: context.auth
      })
      return { ...(await getComments({ ...args, userId: context.userId })) }
    }
  },
  Comment: {
    async replies(parent, args) {
      const resources = [{ resourceId: parent.id, resourceType: 'comment' }]
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
    async repliesCount(parent, _args, ctx) {
      return ctx.loaders.comments.getReplyCount.load(parent.id)
    },
    async replyAuthors(parent, args, ctx) {
      const authorIds = await ctx.loaders.comments.getReplyAuthorIds.load(parent.id)
      return {
        totalCount: authorIds.length,
        authorIds: authorIds.slice(0, args.limit || 25)
      }
    }
  },
  CommentReplyAuthorCollection: {
    async items(parent, _args, ctx) {
      return await ctx.loaders.users.getUser.loadMany(parent.authorIds)
    }
  },
  Project: {
    async commentThreadCount(parent, _args, context) {
      if (context.role === Roles.Server.ArchivedUser)
        throw new ApolloForbiddenError('You are not authorized.')

      return await context.loaders.streams.getCommentThreadCount.load(parent.id)
    },
    async commentThreads(parent, args, context) {
      await authorizeStreamAccess({
        streamId: parent.id,
        userId: context.userId,
        serverRole: context.role,
        auth: context.auth
      })
      return await getPaginatedProjectComments({ ...args, projectId: parent.id })
    }
  },
  Version: {
    async commentThreads(parent, args) {
      return await getPaginatedCommitComments({ ...args, commitId: parent.id })
    }
  },
  Model: {
    async commentThreads(parent, args) {
      return await getPaginatedBranchComments({ ...args, branchId: parent.id })
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
      return await getResourceCommentCount({ resourceId: parent.id })
    }
  },
  Object: {
    async commentCount(parent, args, context) {
      if (context.role === Roles.Server.ArchivedUser)
        throw new ApolloForbiddenError('You are not authorized.')
      return await getResourceCommentCount({ resourceId: parent.id })
    }
  },
  Mutation: {
    // Used for broadcasting real time chat head bubbles and status. Does not persist anything!
    async userViewerActivityBroadcast(parent, args, context) {
      await authorizeStreamAccess({
        streamId: args.streamId,
        userId: context.userId,
        serverRole: context.role,
        auth: context.auth
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
      await pubsub.publish('VIEWER_ACTIVITY', {
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

      if (!stream.allowPublicComments && !stream.role)
        throw new ApolloForbiddenError('You are not authorized.')

      await pubsub.publish('COMMENT_THREAD_ACTIVITY', {
        commentThreadActivity: { type: 'reply-typing-status', data: args.data },
        streamId: args.streamId,
        commentId: args.commentId
      })
      return true
    },

    async commentCreate(parent, args, context) {
      if (!context.userId)
        throw new ApolloForbiddenError('Only registered users can comment.')

      const stream = await getStream({
        streamId: args.input.streamId,
        userId: context.userId
      })

      if (!stream.allowPublicComments && !stream.role)
        throw new ApolloForbiddenError('You are not authorized.')

      const comment = await createComment({
        userId: context.userId,
        input: args.input
      })

      await pubsub.publish('COMMENT_ACTIVITY', {
        commentActivity: {
          type: 'comment-added',
          comment
        },
        streamId: args.input.streamId,
        resourceIds: args.input.resources.map((res) => res.resourceId).join(',') // TODO: hack for now
      })

      await saveActivity({
        streamId: args.input.streamId,
        resourceType: 'comment',
        resourceId: comment.id,
        actionType: ActionTypes.Comment.Create,
        userId: context.userId,
        info: { input: args.input },
        message: `Comment added: ${comment.id} (${args.input})`
      })

      return comment.id
    },

    async commentEdit(parent, args, context) {
      // NOTE: This is NOT in use anywhere
      const stream = await authorizeStreamAccess({
        streamId: args.input.streamId,
        userId: context.userId,
        serverRole: context.role,
        auth: context.auth,
        //public, but not public comments needs a stream role to do this
        requireRole: true
      })
      const matchUser = !stream.role
      try {
        await editComment({ userId: context.userId, input: args.input, matchUser })
        return true
      } catch (err) {
        if (err instanceof ForbiddenError) throw new ApolloForbiddenError(err.message)
        throw err
      }
    },

    // used for flagging a comment as viewed
    async commentView(parent, args, context) {
      await authorizeStreamAccess({
        streamId: args.streamId,
        userId: context.userId,
        serverRole: context.role,
        auth: context.auth
      })
      await viewComment({ userId: context.userId, commentId: args.commentId })
      return true
    },

    async commentArchive(parent, args, context) {
      await authorizeStreamAccess({
        streamId: args.streamId,
        userId: context.userId,
        serverRole: context.role,
        auth: context.auth,
        //public, but not public comments needs a stream role to do this
        requireRole: true
      })

      try {
        await archiveComment({ ...args, userId: context.userId }) // NOTE: permissions check inside service
      } catch (err) {
        if (err instanceof ForbiddenError) throw new ApolloForbiddenError(err.message)
        throw err
      }

      await pubsub.publish('COMMENT_THREAD_ACTIVITY', {
        commentThreadActivity: {
          type: args.archived ? 'comment-archived' : 'comment-added'
        },
        streamId: args.streamId,
        commentId: args.commentId
      })

      await saveActivity({
        streamId: args.streamId,
        resourceType: 'comment',
        resourceId: args.commentId,
        actionType: ActionTypes.Comment.Archive,
        userId: context.userId,
        info: { input: args },
        message: `Comment archived`
      })
      return true
    },

    async commentReply(parent, args, context) {
      if (!context.userId)
        throw new ApolloForbiddenError('Only registered users can comment.')

      const stream = await getStream({
        streamId: args.input.streamId,
        userId: context.userId
      })

      if (!stream.allowPublicComments && !stream.role)
        throw new ApolloForbiddenError('You are not authorized.')

      const reply = await createCommentReply({
        authorId: context.userId,
        parentCommentId: args.input.parentComment,
        streamId: args.input.streamId,
        text: args.input.text,
        data: args.input.data,
        blobIds: args.input.blobIds
      })

      await pubsub.publish('COMMENT_THREAD_ACTIVITY', {
        commentThreadActivity: {
          type: 'reply-added',
          reply
        },
        streamId: args.input.streamId,
        commentId: args.input.parentComment
      })

      await saveActivity({
        streamId: args.input.streamId,
        resourceType: 'comment',
        resourceId: args.input.parentComment,
        actionType: ActionTypes.Comment.Reply,
        userId: context.userId,
        info: { input: args.input },
        message: `Comment reply created.`
      })
      return reply.id
    }
  },
  Subscription: {
    userViewerActivity: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(['VIEWER_ACTIVITY']),
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
      subscribe: withFilter(
        () => pubsub.asyncIterator(['COMMENT_ACTIVITY']),
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
          } catch (e) {
            return false
          }
        }
      )
    },
    commentThreadActivity: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(['COMMENT_THREAD_ACTIVITY']),
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
    }
  }
}
