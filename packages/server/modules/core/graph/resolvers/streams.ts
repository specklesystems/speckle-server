'use strict'
import { UserInputError } from 'apollo-server-express'
import { withFilter } from 'graphql-subscriptions'
import { PermissionUpdateInput } from '@/modules/core/services/streams/management'
import {
  ProjectUpdateInput,
  QueryDiscoverableStreamsArgs,
  StreamUpdateInput
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
  pubsub,
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
import {
  ProjectCreateInput,
  StreamCreateInput
} from '@/modules/core/graph/generated/graphql'
import { LimitedUserRecord, UserRecord } from '@/modules/core/helpers/types'

// subscription events
const USER_STREAM_ADDED = StreamPubsubEvents.UserStreamAdded
const USER_STREAM_REMOVED = StreamPubsubEvents.UserStreamRemoved
const STREAM_UPDATED = StreamPubsubEvents.StreamUpdated
const STREAM_DELETED = StreamPubsubEvents.StreamDeleted

const _deleteStream = async (
  _parent: never,
  args: { id: string },
  context: AuthContext
) => {
  if (!context.userId) throw new Error('Invalid user id.')
  return await deleteStreamAndNotify(args.id, context.userId)
}

const getUserStreamsCore = async (
  forOtherUser: boolean,
  parent: { id: string },
  args: { limit: number; cursor: string }
) => {
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
    async stream(_: never, args: { id: string }, context: AuthContext) {
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

    async streams(
      parent: never,
      args: { query: string; limit: number; cursor: string },
      context: AuthContext
    ) {
      if (!context.userId) throw new Error('Invalid user id.')

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

    async discoverableStreams(parent: never, args: QueryDiscoverableStreamsArgs) {
      return await getDiscoverableStreams(args)
    },

    async adminStreams(
      parent: never,
      args: {
        limit: number
        orderBy: string
        query: string
        cursor: Date
        visibility: 'all' | 'public' | 'private'
      }
    ) {
      if (args.limit && args.limit > 50)
        throw new UserInputError('Cannot return more than 50 items at a time.')

      const { streams, totalCount } = await getStreams({
        limit: args.limit,
        orderBy: args.orderBy,
        searchQuery: args.query,
        visibility: args.visibility,
        cursor: args.cursor
      })
      return { totalCount, items: streams }
    }
  },

  Stream: {
    async collaborators(parent: { id: string }) {
      const users = await getStreamUsers({ streamId: parent.id })
      return users
    },

    async pendingCollaborators(parent: { id: string }) {
      const { id: streamId } = parent
      return await getPendingStreamCollaborators(streamId)
    },

    async favoritedDate(
      parent: { id: string },
      _args: never,
      ctx: AuthContext & {
        loaders: {
          streams: {
            getUserFavoriteData: {
              load: (streamId: string) => Promise<{ createdAt: Date }>
            }
          }
        }
      }
    ) {
      const { id: streamId } = parent
      return await getActiveUserStreamFavoriteDate({ ctx, streamId })
    },

    async favoritesCount(
      parent: { id: string },
      _args: never,
      ctx: AuthContext & {
        loaders: {
          streams: {
            getFavoritesCount: { load: (streamId: string) => Promise<number> }
          }
        }
      }
    ) {
      const { id: streamId } = parent

      return await getStreamFavoritesCount({ ctx, streamId })
    },

    async isDiscoverable(parent: { isPublic: boolean; isDiscoverable: boolean }) {
      const { isPublic, isDiscoverable } = parent

      if (!isPublic) return false
      return isDiscoverable
    },

    async role(
      parent: { id: string; role: string },
      _args: never,
      ctx: {
        loaders: { streams: { getRole: { load: (id: string) => Promise<unknown> } } }
      }
    ) {
      // If role already resolved, return that
      if (has(parent, 'role')) return parent.role

      // Otherwise resolve it now through a dataloader
      return await ctx.loaders.streams.getRole.load(parent.id)
    }
  },
  User: {
    async streams(
      parent: { id: string },
      args: { limit: number; cursor: string },
      context: AuthContext
    ) {
      // Return only the user's public streams if parent.id !== context.userId
      const forOtherUser = parent.id !== context.userId
      return await getUserStreamsCore(forOtherUser, parent, args)
    },

    async favoriteStreams(
      parent: { id: string },
      args: { limit: number; cursor: string },
      context: AuthContext
    ) {
      const { userId } = context
      const { id: requestedUserId } = parent || {}
      const { limit, cursor } = args

      if (userId !== requestedUserId)
        throw new UserInputError("Cannot view another user's favorite streams")

      return await getFavoriteStreamsCollection({ userId, limit, cursor })
    },

    async totalOwnedStreamsFavorites(
      parent: { id: string },
      _args: never,
      ctx: AuthContext & {
        loaders: {
          streams: {
            getOwnedFavoritesCount: { load: (userId: string) => Promise<number> }
          }
        }
      }
    ) {
      const { id: userId } = parent
      return await getOwnedFavoritesCount({ ctx, userId })
    }
  },
  LimitedUser: {
    async streams(
      parent: { id: string },
      args: { limit: number; cursor: string },
      context: AuthContext
    ) {
      // a little escape hatch for admins to look into users streams

      const isAdmin = adminOverrideEnabled() && context.role === Roles.Server.Admin
      return await getUserStreamsCore(!isAdmin, parent, args)
    },
    async totalOwnedStreamsFavorites(
      parent: { id: string },
      _args: never,
      ctx: AuthContext & {
        loaders: {
          streams: {
            getOwnedFavoritesCount: { load: (userId: string) => Promise<number> }
          }
        }
      }
    ) {
      const { id: userId } = parent
      return await getOwnedFavoritesCount({ ctx, userId })
    }
  },
  Mutation: {
    async streamCreate(
      parent: never,
      args: { stream: StreamCreateInput | ProjectCreateInput },
      context: AuthContext
    ) {
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

    async streamUpdate(
      parent: never,
      args: { stream: StreamUpdateInput | ProjectUpdateInput },
      context: AuthContext
    ) {
      await authorizeResolver(context.userId, args.stream.id, Roles.Stream.Owner)
      if (!context.userId) throw new Error('Invalid user id.')
      await updateStreamAndNotify(args.stream, context.userId)
      return true
    },

    async streamDelete(parent: never, args: { id: string }, context: AuthContext) {
      await authorizeResolver(context.userId, args.id, Roles.Stream.Owner)
      return await _deleteStream(parent, args, context)
    },

    async streamsDelete(parent: never, args: { ids: string[] }, context: AuthContext) {
      const results = await Promise.all(
        args.ids.map(async (id) => {
          const newArgs = { id }
          return await _deleteStream(parent, newArgs, context)
        })
      )
      return results.every((res) => res === true)
    },

    async streamUpdatePermission(
      parent: never,
      args: { permissionParams: PermissionUpdateInput & { streamId: string } },
      context: AuthContext
    ) {
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

    async streamRevokePermission(
      parent: never,
      args: { permissionParams: PermissionUpdateInput & { streamId: string } },
      context: AuthContext
    ) {
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

    async streamFavorite(
      _parent: never,
      args: { streamId: string; favorited?: boolean },
      ctx: AuthContext
    ) {
      const { streamId, favorited } = args
      const { userId } = ctx
      if (!userId) throw new Error('Invalid user id.')

      return await favoriteStream({ userId, streamId, favorited })
    },

    async streamLeave(_parent: never, args: { streamId: string }, ctx: AuthContext) {
      const { streamId } = args
      const { userId } = ctx
      if (!userId) throw new Error('Invalid user id.')

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
    async serverRole(
      parent: { id: string },
      _args: never,
      ctx: AuthContext & {
        loaders: {
          users: { getUser: { load: (id: string) => Promise<{ role: string }> } }
        }
      }
    ) {
      const { id } = parent
      const user = await ctx.loaders.users.getUser.load(id)
      return user?.role
    }
  },
  PendingStreamCollaborator: {
    /**
     * @param {import('@/modules/serverinvites/services/inviteRetrievalService').PendingStreamCollaboratorGraphQLType} parent
     */
    async invitedBy(
      parent: { invitedById: string },
      _args: never,
      ctx: AuthContext & {
        loaders: {
          users: {
            getUser: { load: (id: string) => Promise<UserRecord | LimitedUserRecord> }
          }
        }
      }
    ) {
      const { invitedById } = parent
      if (!invitedById) return null

      const user = await ctx.loaders.users.getUser.load(invitedById)
      return user ? removePrivateFields(user) : null
    },
    /**
     * @param {import('@/modules/serverinvites/services/inviteRetrievalService').PendingStreamCollaboratorGraphQLType} parent
     */
    async streamName(
      parent: { streamId: string },
      _args: never,
      ctx: AuthContext & {
        loaders: {
          streams: { getStream: { load: (id: string) => Promise<{ name: string }> } }
        }
      }
    ) {
      const { streamId } = parent
      const stream = await ctx.loaders.streams.getStream.load(streamId)
      return stream.name
    },
    /**
     * @param {import('@/modules/serverinvites/services/inviteRetrievalService').PendingStreamCollaboratorGraphQLType} parent
     */
    async token(
      parent: { inviteId: string; user?: { id: string } },
      _args: never,
      ctx: AuthContext & {
        loaders: {
          invites: {
            getInvite: { load: (id: string) => Promise<{ token: string } | undefined> } //FIXME why would this return undefined and not null?
          }
        }
      }
    ) {
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
