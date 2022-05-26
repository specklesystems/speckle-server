const { authorizeResolver, pubsub } = require('@/modules/shared')
const { ForbiddenError, ApolloError, withFilter } = require('apollo-server-express')
const { getStream } = require('@/modules/core/services/streams')
const { saveActivity } = require('@/modules/activitystream/services')

const {
  getComment,
  getComments,
  getResourceCommentCount,
  getStreamCommentCount,
  createComment,
  createCommentReply,
  viewComment,
  archiveComment,
  editComment,
  streamResourceCheck,
  formatCommentText
} = require('@/modules/comments/services')

const authorizeStreamAccess = async ({ streamId, userId, auth }) => {
  const stream = await getStream({ streamId, userId })
  if (!stream) throw new ApolloError('Stream not found')

  if (!stream.isPublic && auth === false)
    throw new ForbiddenError('You are not authorized.')

  if (!stream.isPublic && !stream.role) {
    throw new ForbiddenError('You are not authorized.')
  }
}

module.exports = {
  Query: {
    async comment(parent, args, context) {
      await authorizeStreamAccess({
        streamId: args.streamId,
        userId: context.userId,
        auth: context.auth
      })
      const comment = await getComment({ id: args.id, userId: context.userId })
      if (comment.streamId !== args.streamId)
        throw new ForbiddenError('You do not have access to this comment.')
      return comment
    },

    async comments(parent, args, context) {
      await authorizeStreamAccess({
        streamId: args.streamId,
        userId: context.userId,
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
    text(parent) {
      return formatCommentText(parent)
    }
  },
  Stream: {
    async commentCount(parent) {
      return await getStreamCommentCount({ streamId: parent.id })
    }
  },
  Commit: {
    async commentCount(parent) {
      return await getResourceCommentCount({ resourceId: parent.id })
    }
  },
  CommitCollectionUserNode: {
    // urgh, i think we tripped our gql schemas in there a bit
    async commentCount(parent) {
      return await getResourceCommentCount({ resourceId: parent.id })
    }
  },
  Object: {
    async commentCount(parent) {
      return await getResourceCommentCount({ resourceId: parent.id })
    }
  },
  Mutation: {
    // Used for broadcasting real time chat head bubbles and status. Does not persist anything!
    async userViewerActivityBroadcast(parent, args, context) {
      const stream = await getStream({
        streamId: args.streamId,
        userId: context.userId
      })
      if (!stream) {
        throw new ApolloError('Stream not found')
      }

      if (!stream.isPublic && !context.auth) {
        return false
      }

      await pubsub.publish('VIEWER_ACTIVITY', {
        userViewerActivity: args.data,
        streamId: args.streamId,
        resourceId: args.resourceId
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
        throw new ForbiddenError('You are not authorized.')

      await pubsub.publish('COMMENT_THREAD_ACTIVITY', {
        commentThreadActivity: { eventType: 'reply-typing-status', data: args.data },
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

      if (!stream.allowPublicComments && !stream.role)
        throw new ForbiddenError('You are not authorized.')

      const id = await createComment({ userId: context.userId, input: args.input })

      await pubsub.publish('COMMENT_ACTIVITY', {
        commentActivity: {
          ...args.input,
          authorId: context.userId,
          id,
          replies: { totalCount: 0 },
          updatedAt: Date.now(),
          createdAt: Date.now(),
          eventType: 'comment-added',
          archived: false
        },
        streamId: args.input.streamId,
        resourceIds: args.input.resources.map((res) => res.resourceId).join(',') // TODO: hack for now
      })

      await saveActivity({
        streamId: args.input.streamId,
        resourceType: 'comment',
        resourceId: id,
        actionType: 'comment_created',
        userId: context.userId,
        info: { input: args.input },
        message: `Comment added: ${id} (${args.input})`
      })

      return id
    },

    async commentEdit(parent, args, context) {
      // NOTE: This is NOT in use anywhere
      await authorizeResolver(context.userId, args.input.streamId, 'stream:reviewer')
      await editComment({ userId: context.userId, input: args.input })
      return true
    },

    // used for flagging a comment as viewed
    async commentView(parent, args, context) {
      const stream = await getStream({
        streamId: args.streamId,
        userId: context.userId
      })

      if (!stream.allowPublicComments && !stream.role)
        throw new ForbiddenError('You are not authorized.')

      await viewComment({ userId: context.userId, commentId: args.commentId })
      return true
    },

    async commentArchive(parent, args, context) {
      await authorizeStreamAccess({
        streamId: args.streamId,
        userId: context.userId,
        auth: context.auth
      })

      await archiveComment({ ...args, userId: context.userId }) // NOTE: permissions check inside service

      await pubsub.publish('COMMENT_THREAD_ACTIVITY', {
        commentThreadActivity: {
          eventType: args.archived ? 'comment-archived' : 'comment-added'
        },
        streamId: args.streamId,
        commentId: args.commentId
      })

      await saveActivity({
        streamId: args.streamId,
        resourceType: 'comment',
        resourceId: args.commentId,
        actionType: 'comment_archived',
        userId: context.userId,
        info: { input: args },
        message: `Comment archived`
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

      if (!stream.allowPublicComments && !stream.role)
        throw new ForbiddenError('You are not authorized.')

      const id = await createCommentReply({
        authorId: context.userId,
        parentCommentId: args.input.parentComment,
        streamId: args.input.streamId,
        text: args.input.text,
        data: args.input.data
      })

      await pubsub.publish('COMMENT_THREAD_ACTIVITY', {
        commentThreadActivity: {
          eventType: 'reply-added',
          ...args.input,
          id,
          authorId: context.userId,
          updatedAt: Date.now(),
          createdAt: Date.now()
        },
        streamId: args.input.streamId,
        commentId: args.input.parentComment
      })

      await saveActivity({
        streamId: args.input.streamId,
        resourceType: 'comment',
        resourceId: args.input.parentComment,
        actionType: 'comment_reply',
        userId: context.userId,
        info: { input: args.input },
        message: `Comment reply created.`
      })
      return id
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
            throw new ForbiddenError('You are not authorized.')

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
            throw new ForbiddenError('You are not authorized.')

          return (
            payload.streamId === variables.streamId &&
            payload.commentId === variables.commentId
          )
        }
      )
    }
  }
}
