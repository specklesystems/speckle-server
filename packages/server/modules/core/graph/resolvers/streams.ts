'use strict'
import { UserInputError } from 'apollo-server-express'
import {
  RequireFields,
  Resolvers,
  UserStreamsArgs
} from '@/modules/core/graph/generated/graphql'
import {
  getStream,
  getStreams,
  getStreamUsers,
  favoriteStream,
  getFavoriteStreamsCollection,
  getActiveUserStreamFavoriteDate,
  getStreamFavoritesCount,
  getOwnedFavoritesCount
} from '@/modules/core/services/streams'

import {
  filteredSubscribe,
  StreamSubscriptions as StreamPubsubEvents
} from '@/modules/shared/utils/subscriptions'

import { authorizeResolver, validateScopes } from '@/modules/shared'
import {
  RateLimitAction,
  getRateLimitResult,
  isRateLimitBreached
} from '@/modules/core/services/ratelimiter'
import { RateLimitError } from '@/modules/core/errors/ratelimit'
import { getPendingStreamCollaborators } from '@/modules/serverinvites/services/inviteRetrievalService'
import { removePrivateFields } from '@/modules/core/helpers/userHelper'
import { removeStreamCollaborator } from '@/modules/core/services/streams/streamAccessService'
import { getDiscoverableStreams } from '@/modules/core/services/streams/discoverableStreams'
import { has } from 'lodash'
import {
  getUserStreamsCount,
  getUserStreams
} from '@/modules/core/repositories/streams'
import {
  deleteStreamAndNotify,
  updateStreamAndNotify,
  createStreamReturnRecord,
  updateStreamRoleAndNotify
} from '@/modules/core/services/streams/management'
import { adminOverrideEnabled } from '@/modules/shared/helpers/envHelper'
import { Roles, Scopes } from '@speckle/shared'
import { StreamNotFoundError } from '@/modules/core/errors/stream'
import { AuthContext, throwForNotHavingServerRole } from '@/modules/shared/authz'

// subscription events
const USER_STREAM_ADDED = StreamPubsubEvents.UserStreamAdded
const USER_STREAM_REMOVED = StreamPubsubEvents.UserStreamRemoved
const STREAM_UPDATED = StreamPubsubEvents.StreamUpdated
const STREAM_DELETED = StreamPubsubEvents.StreamDeleted

const _deleteStream = async (
  _parent: unknown,
  args: { id: string },
  context: AuthContext
) => {
  if (!context.userId) throw new Error('Invalid user id.')
  return await deleteStreamAndNotify(args.id, context.userId)
}

const getUserStreamsCore = async (
  forOtherUser: boolean,
  parent: { id: string },
  args: RequireFields<UserStreamsArgs, 'limit'>
) => {
  const totalCount = await getUserStreamsCount({ userId: parent.id, forOtherUser })

  const { cursor, streams } = await getUserStreams({
    userId: parent.id,
    limit: args.limit,
    cursor: args.cursor || undefined,
    forOtherUser
  })

  return { totalCount, cursor, items: streams }
}

export = {
  Query: {
    async stream(_parent, args, context) {
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

    async streams(_parent, args, context) {
      if (!context.userId) throw new Error('Invalid user id.')

      const totalCount = await getUserStreamsCount({
        userId: context.userId,
        searchQuery: args.query || undefined
      })

      const { cursor, streams } = await getUserStreams({
        userId: context.userId,
        limit: args.limit,
        cursor: args.cursor || undefined,
        searchQuery: args.query || undefined
      })
      return { totalCount, cursor, items: streams }
    },

    async discoverableStreams(_parent, args) {
      return await getDiscoverableStreams(args)
    },

    async adminStreams(_parent, args) {
      if (args.limit && args.limit > 50)
        throw new UserInputError('Cannot return more than 50 items at a time.')

      const { streams, totalCount } = await getStreams({
        limit: args.limit,
        orderBy: args.orderBy || null,
        searchQuery: args.query || null,
        visibility: args.visibility || null,
        cursor: new Date(args.offset) || null
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

      return await getFavoriteStreamsCollection({
        userId,
        limit,
        cursor: cursor || undefined
      })
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
    async streamCreate(_parent, args, context) {
      if (!context.userId) throw new Error('Invalid user id.')

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

    async streamUpdate(_parent, args, context) {
      await authorizeResolver(context.userId, args.stream.id, Roles.Stream.Owner)
      if (!context.userId) throw new Error('Invalid user id.')
      await updateStreamAndNotify(args.stream, context.userId)
      return true
    },

    async streamDelete(_parent, args, context) {
      await authorizeResolver(context.userId, args.id, Roles.Stream.Owner)
      return await _deleteStream(parent, args, context)
    },

    async streamsDelete(parent, args, context) {
      if (!args.ids) return true // all (zero) ids were deleted!
      const results = await Promise.all(
        args.ids.map(async (id) => {
          const newArgs = { id }
          return await _deleteStream(parent, newArgs, context)
        })
      )
      return results.every((res) => res === true)
    },

    async streamUpdatePermission(_parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.permissionParams.streamId,
        Roles.Stream.Owner
      )

      if (!context.userId) throw new Error('Invalid user id.')

      const result = await updateStreamRoleAndNotify(
        args.permissionParams,
        context.userId
      )
      return !!result
    },

    async streamRevokePermission(_parent, args, context) {
      await authorizeResolver(
        context.userId,
        args.permissionParams.streamId,
        Roles.Stream.Owner
      )

      if (!context.userId) throw new Error('Invalid user id.')

      const result = await updateStreamRoleAndNotify(
        args.permissionParams,
        context.userId
      )
      return !!result
    },

    async streamFavorite(_parent, args, ctx) {
      const { streamId, favorited } = args
      const { userId } = ctx
      if (!userId) throw new Error('Invalid user id.')

      return await favoriteStream({ userId, streamId, favorited })
    },

    async streamLeave(_parent, args, ctx) {
      const { streamId } = args
      const { userId } = ctx
      if (!userId) throw new Error('Invalid user id.')

      await removeStreamCollaborator(streamId, userId, userId)

      return true
    }
  },

  Subscription: {
    userStreamAdded: {
      subscribe: filteredSubscribe(
        USER_STREAM_ADDED,
        (payload, _variables, context) => {
          return payload.ownerId === context.userId
        }
      )
    },

    userStreamRemoved: {
      subscribe: filteredSubscribe(
        USER_STREAM_REMOVED,
        (payload, _variables, context) => {
          return payload.ownerId === context.userId
        }
      )
    },

    streamUpdated: {
      subscribe: filteredSubscribe(
        STREAM_UPDATED,
        async (payload, variables, context) => {
          await authorizeResolver(context.userId, payload.id, Roles.Stream.Reviewer)
          return payload.id === variables.streamId
        }
      )
    },

    streamDeleted: {
      subscribe: filteredSubscribe(
        STREAM_DELETED,
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
    async invitedBy(parent, _args, ctx) {
      const { invitedById } = parent
      if (!invitedById) return null

      const user = await ctx.loaders.users.getUser.load(invitedById)
      return user ? removePrivateFields(user) : null
    },
    async streamName(parent, _args, ctx) {
      const { streamId } = parent
      const stream = await ctx.loaders.streams.getStream.load(streamId)
      if (!stream) return null
      return stream.name
    },
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
} as Resolvers
