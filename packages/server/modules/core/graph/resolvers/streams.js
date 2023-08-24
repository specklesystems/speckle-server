'use strict'
const { UserInputError } = require('apollo-server-express')
const { withFilter } = require('graphql-subscriptions')

const {
  getStream,
  getStreams,
  getStreamUsers,
  favoriteStream,
  getFavoriteStreamsCollection,
  getActiveUserStreamFavoriteDate,
  getStreamFavoritesCount,
  getOwnedFavoritesCount
} = require('@/modules/core/services/streams')

const {
  pubsub,
  StreamSubscriptions: StreamPubsubEvents
} = require(`@/modules/shared/utils/subscriptions`)

const { authorizeResolver, validateScopes } = require(`@/modules/shared`)
const {
  RateLimitError,
  RateLimitAction,
  getRateLimitResult,
  isRateLimitBreached
} = require('@/modules/core/services/ratelimiter')
const {
  getPendingStreamCollaborators
} = require('@/modules/serverinvites/services/inviteRetrievalService')
const { removePrivateFields } = require('@/modules/core/helpers/userHelper')
const {
  removeStreamCollaborator
} = require('@/modules/core/services/streams/streamAccessService')
const {
  getDiscoverableStreams
} = require('@/modules/core/services/streams/discoverableStreams')
const { has } = require('lodash')
const {
  getUserStreamsCount,
  getUserStreams
} = require('@/modules/core/repositories/streams')
const {
  deleteStreamAndNotify,
  updateStreamAndNotify,
  createStreamReturnRecord,
  updateStreamRoleAndNotify
} = require('@/modules/core/services/streams/management')
const { adminOverrideEnabled } = require('@/modules/shared/helpers/envHelper')
const { Roles, Scopes } = require('@speckle/shared')
const { StreamNotFoundError } = require('@/modules/core/errors/stream')
const { throwForNotHavingServerRole } = require('@/modules/shared/authz')

// subscription events
const USER_STREAM_ADDED = StreamPubsubEvents.UserStreamAdded
const USER_STREAM_REMOVED = StreamPubsubEvents.UserStreamRemoved
const STREAM_UPDATED = StreamPubsubEvents.StreamUpdated
const STREAM_DELETED = StreamPubsubEvents.StreamDeleted

const _deleteStream = async (_parent, args, context) => {
  return await deleteStreamAndNotify(args.id, context.userId)
}

const getUserStreamsCore = async (forOtherUser, parent, args) => {
  const totalCount = await getUserStreamsCount({ userId: parent.id, forOtherUser })

  const { cursor, streams } = await getUserStreams({
    userId: parent.id,
    limit: args.limit,
    cursor: args.cursor,
    forOtherUser
  })

  return { totalCount, cursor, items: streams }
}

/**
 * @type {import('@/modules/core/graph/generated/graphql').Resolvers}
 */
module.exports = {
  Query: {
    async stream(_, args, context) {
      const stream = await getStream({ streamId: args.id, userId: context.userId })
      if (!stream) {
        throw new StreamNotFoundError('Stream not found')
      }

      await authorizeResolver(context.userId, args.id, Roles.Stream.Reviewer)

      if (!stream.isPublic) {
        await throwForNotHavingServerRole(context, Roles.Server.Guest)
        await validateScopes(context.scopes, Scopes.Streams.Read)
      }

      return stream
    },

    async streams(parent, args, context) {
      const totalCount = await getUserStreamsCount({
        userId: context.userId,
        searchQuery: args.query
      })

      const { cursor, streams } = await getUserStreams({
        userId: context.userId,
        limit: args.limit,
        cursor: args.cursor,
        searchQuery: args.query
      })
      return { totalCount, cursor, items: streams }
    },

    async discoverableStreams(parent, args) {
      return await getDiscoverableStreams(args)
    },

    async adminStreams(parent, args) {
      if (args.limit && args.limit > 50)
        throw new UserInputError('Cannot return more than 50 items at a time.')

      const { streams, totalCount } = await getStreams({
        offset: args.offset,
        limit: args.limit,
        orderBy: args.orderBy,
        publicOnly: args.publicOnly,
        searchQuery: args.query,
        visibility: args.visibility
      })
      return { totalCount, items: streams }
    }
  },

  Stream: {
    async collaborators(parent) {
      const users = await getStreamUsers({ streamId: parent.id })
      return users
    },

    async pendingCollaborators(parent) {
      const { id: streamId } = parent
      return await getPendingStreamCollaborators(streamId)
    },

    async favoritedDate(parent, _args, ctx) {
      const { id: streamId } = parent
      return await getActiveUserStreamFavoriteDate({ ctx, streamId })
    },

    async favoritesCount(parent, _args, ctx) {
      const { id: streamId } = parent

      return await getStreamFavoritesCount({ ctx, streamId })
    },

    async isDiscoverable(parent) {
      const { isPublic, isDiscoverable } = parent

      if (!isPublic) return false
      return isDiscoverable
    },

    async role(parent, _args, ctx) {
      // If role already resolved, return that
      if (has(parent, 'role')) return parent.role

      // Otherwise resolve it now through a dataloader
      return await ctx.loaders.streams.getRole.load(parent.id)
    }
  },
  User: {
    async streams(parent, args, context) {
      // Return only the user's public streams if parent.id !== context.userId
      const forOtherUser = parent.id !== context.userId
      return await getUserStreamsCore(forOtherUser, parent, args)
    },

    async favoriteStreams(parent, args, context) {
      const { userId } = context
      const { id: requestedUserId } = parent || {}
      const { limit, cursor } = args

      if (userId !== requestedUserId)
        throw new UserInputError("Cannot view another user's favorite streams")

      return await getFavoriteStreamsCollection({ userId, limit, cursor })
    },

    async totalOwnedStreamsFavorites(parent, _args, ctx) {
      const { id: userId } = parent
      return await getOwnedFavoritesCount({ ctx, userId })
    }
  },
  LimitedUser: {
    async streams(parent, args, context) {
      // a little escape hatch for admins to look into users streams

      const isAdmin = adminOverrideEnabled() && context.role === Roles.Server.Admin
      return await getUserStreamsCore(!isAdmin, parent, args)
    },
    async totalOwnedStreamsFavorites(parent, _args, ctx) {
      const { id: userId } = parent
      return await getOwnedFavoritesCount({ ctx, userId })
    }
  },
  Mutation: {
    async streamCreate(parent, args, context) {
      const rateLimitResult = await getRateLimitResult(
        RateLimitAction.STREAM_CREATE,
        context.userId
      )
      if (isRateLimitBreached(rateLimitResult)) {
        throw new RateLimitError(rateLimitResult)
      }

      const { id } = await createStreamReturnRecord(
        { ...args.stream, ownerId: context.userId },
        { createActivity: true }
      )

      return id
    },

    async streamUpdate(parent, args, context) {
      await authorizeResolver(context.userId, args.stream.id, Roles.Stream.Owner)
      await updateStreamAndNotify(args.stream, context.userId)
      return true
    },

    async streamDelete(parent, args, context, info) {
      await authorizeResolver(context.userId, args.id, Roles.Stream.Owner)
      return await _deleteStream(parent, args, context, info)
    },

    async streamsDelete(parent, args, context, info) {
      const results = await Promise.all(
        args.ids.map(async (id) => {
          const newArgs = { ...args }
          newArgs.id = id
          return await _deleteStream(parent, newArgs, context, info)
        })
      )
      return results.every((res) => res === true)
    },

    async streamUpdatePermission(parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.permissionParams.streamId,
        Roles.Stream.Owner
      )

      const result = await updateStreamRoleAndNotify(
        args.permissionParams,
        context.userId
      )
      return !!result
    },

    async streamRevokePermission(parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.permissionParams.streamId,
        Roles.Stream.Owner
      )

      const result = await updateStreamRoleAndNotify(
        args.permissionParams,
        context.userId
      )
      return !!result
    },

    async streamFavorite(_parent, args, ctx) {
      const { streamId, favorited } = args
      const { userId } = ctx

      return await favoriteStream({ userId, streamId, favorited })
    },

    async streamLeave(_parent, args, ctx) {
      const { streamId } = args
      const { userId } = ctx

      await removeStreamCollaborator(streamId, userId, userId)

      return true
    }
  },

  Subscription: {
    userStreamAdded: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([USER_STREAM_ADDED]),
        (payload, variables, context) => {
          return payload.ownerId === context.userId
        }
      )
    },

    userStreamRemoved: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([USER_STREAM_REMOVED]),
        (payload, variables, context) => {
          return payload.ownerId === context.userId
        }
      )
    },

    streamUpdated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([STREAM_UPDATED]),
        async (payload, variables, context) => {
          await authorizeResolver(context.userId, payload.id, Roles.Stream.Reviewer)
          return payload.id === variables.streamId
        }
      )
    },

    streamDeleted: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([STREAM_DELETED]),
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
  },
  StreamCollaborator: {
    async serverRole(parent, _args, ctx) {
      const { id } = parent
      const user = await ctx.loaders.users.getUser.load(id)
      return user?.role
    }
  },
  PendingStreamCollaborator: {
    /**
     * @param {import('@/modules/serverinvites/services/inviteRetrievalService').PendingStreamCollaboratorGraphQLType} parent
     */
    async invitedBy(parent, _args, ctx) {
      const { invitedById } = parent
      if (!invitedById) return null

      const user = await ctx.loaders.users.getUser.load(invitedById)
      return user ? removePrivateFields(user) : null
    },
    /**
     * @param {import('@/modules/serverinvites/services/inviteRetrievalService').PendingStreamCollaboratorGraphQLType} parent
     */
    async streamName(parent, _args, ctx) {
      const { streamId } = parent
      const stream = await ctx.loaders.streams.getStream.load(streamId)
      return stream.name
    },
    /**
     * @param {import('@/modules/serverinvites/services/inviteRetrievalService').PendingStreamCollaboratorGraphQLType} parent
     */
    async token(parent, _args, ctx) {
      const authedUserId = ctx.userId
      const targetUserId = parent.user?.id
      const inviteId = parent.inviteId

      // Only returning it for the user that is the pending stream collaborator
      if (!authedUserId || !targetUserId || authedUserId !== targetUserId) {
        return null
      }

      const invite = await ctx.loaders.invites.getInvite.load(inviteId)
      return invite?.token || null
    }
  }
}
