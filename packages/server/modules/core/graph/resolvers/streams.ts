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
  StreamSubscriptions
} from '@/modules/shared/utils/subscriptions'
import { authorizeResolver, validateScopes } from '@/modules/shared'
import {
  getRateLimitResult,
  isRateLimitBreached
} from '@/modules/core/services/ratelimiter'
import { getPendingProjectCollaboratorsFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { removePrivateFields } from '@/modules/core/helpers/userHelper'
import { removeStreamCollaborator } from '@/modules/core/services/streams/streamAccessService'
import { getDiscoverableStreams } from '@/modules/core/services/streams/discoverableStreams'
import { get } from 'lodash'
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
import { throwForNotHavingServerRole } from '@/modules/shared/authz'
import { RateLimitError } from '@/modules/core/errors/ratelimit'

import { toProjectIdWhitelist, isResourceAllowed } from '@/modules/core/helpers/token'
import {
  Resolvers,
  TokenResourceIdentifierType,
  UserStreamsArgs
} from '@/modules/core/graph/generated/graphql'
import { queryAllResourceInvitesFactory } from '@/modules/serverinvites/repositories/serverInvites'
import db from '@/db/knex'
import { getInvitationTargetUsersFactory } from '@/modules/serverinvites/services/retrieval'
import { getUsers } from '@/modules/core/repositories/users'
import { BadRequestError } from '@/modules/shared/errors'

const getUserStreamsCore = async (
  forOtherUser: boolean,
  parent: { id: string },
  args: UserStreamsArgs,
  streamIdWhitelist?: string[]
) => {
  const totalCount = await getUserStreamsCount({
    userId: parent.id,
    forOtherUser,
    streamIdWhitelist
  })

  const { cursor, streams } = await getUserStreams({
    userId: parent.id,
    limit: args.limit,
    cursor: args.cursor,
    forOtherUser,
    streamIdWhitelist
  })

  return { totalCount, cursor, items: streams }
}

/**
 * @type {import('@/modules/core/graph/generated/graphql').Resolvers}
 */
export = {
  Query: {
    async stream(_, args, context) {
      const stream = await getStream({ streamId: args.id, userId: context.userId })
      if (!stream) {
        throw new StreamNotFoundError('Stream not found')
      }

      await authorizeResolver(
        context.userId,
        args.id,
        Roles.Stream.Reviewer,
        context.resourceAccessRules
      )

      if (!stream.isPublic) {
        await throwForNotHavingServerRole(context, Roles.Server.Guest)
        await validateScopes(context.scopes, Scopes.Streams.Read)
      }

      return stream
    },

    async streams(parent, args, context) {
      const totalCount = await getUserStreamsCount({
        userId: context.userId!,
        searchQuery: args.query || undefined,
        streamIdWhitelist: toProjectIdWhitelist(context.resourceAccessRules)
      })

      const { cursor, streams } = await getUserStreams({
        userId: context.userId!,
        limit: args.limit,
        cursor: args.cursor,
        searchQuery: args.query || undefined,
        streamIdWhitelist: toProjectIdWhitelist(context.resourceAccessRules)
      })
      return { totalCount, cursor, items: streams }
    },

    async discoverableStreams(parent, args, ctx) {
      return await getDiscoverableStreams(
        args,
        toProjectIdWhitelist(ctx.resourceAccessRules)
      )
    },

    async adminStreams(parent, args, ctx) {
      if (args.limit && args.limit > 50)
        throw new BadRequestError('Cannot return more than 50 items at a time.')

      const { streams, totalCount } = await getStreams({
        offset: args.offset,
        limit: args.limit,
        orderBy: args.orderBy,
        publicOnly: null,
        searchQuery: args.query,
        visibility: args.visibility,
        streamIdWhitelist: toProjectIdWhitelist(ctx.resourceAccessRules),
        cursor: null
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
      return await getPendingProjectCollaboratorsFactory({
        queryAllResourceInvites: queryAllResourceInvitesFactory({ db }),
        getInvitationTargetUsers: getInvitationTargetUsersFactory({ getUsers })
      })(streamId)
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
      const role = get(parent, 'role') as string | undefined
      if (role?.length) return role

      // Otherwise resolve it now through a dataloader
      return await ctx.loaders.streams.getRole.load(parent.id)
    }
  },
  User: {
    async streams(parent, args, context) {
      // Return only the user's public streams if parent.id !== context.userId
      const forOtherUser = parent.id !== context.userId
      return await getUserStreamsCore(
        forOtherUser,
        parent,
        args,
        toProjectIdWhitelist(context.resourceAccessRules)
      )
    },

    async favoriteStreams(parent, args, context) {
      const { userId } = context
      const { id: requestedUserId } = parent || {}
      const { limit, cursor } = args

      if (userId !== requestedUserId)
        throw new BadRequestError("Cannot view another user's favorite streams")

      return await getFavoriteStreamsCollection({
        userId,
        limit,
        cursor,
        streamIdWhitelist: toProjectIdWhitelist(context.resourceAccessRules)
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
      return await getUserStreamsCore(
        !isAdmin,
        parent,
        args,
        toProjectIdWhitelist(context.resourceAccessRules)
      )
    },
    async totalOwnedStreamsFavorites(parent, _args, ctx) {
      const { id: userId } = parent
      return await getOwnedFavoritesCount({ ctx, userId })
    }
  },
  Mutation: {
    async streamCreate(parent, args, context) {
      const rateLimitResult = await getRateLimitResult('STREAM_CREATE', context.userId!)
      if (isRateLimitBreached(rateLimitResult)) {
        throw new RateLimitError(rateLimitResult)
      }

      const { id } = await createStreamReturnRecord(
        {
          ...args.stream,
          ownerId: context.userId!,
          ownerResourceAccessRules: context.resourceAccessRules
        },
        { createActivity: true }
      )

      return id
    },

    async streamUpdate(parent, args, context) {
      await updateStreamAndNotify(
        args.stream,
        context.userId!,
        context.resourceAccessRules
      )
      return true
    },

    async streamDelete(parent, args, context) {
      return await deleteStreamAndNotify(
        args.id,
        context.userId!,
        context.resourceAccessRules,
        { skipAccessChecks: false }
      )
    },

    async streamsDelete(parent, args, context) {
      const results = await Promise.all(
        (args.ids || []).map(async (id) => {
          return await deleteStreamAndNotify(
            id,
            context.userId!,
            context.resourceAccessRules,
            { skipAccessChecks: true }
          )
        })
      )
      return results.every((res) => res === true)
    },

    async streamUpdatePermission(parent, args, context) {
      const result = await updateStreamRoleAndNotify(
        args.permissionParams,
        context.userId!,
        context.resourceAccessRules
      )
      return !!result
    },

    async streamRevokePermission(parent, args, context) {
      const result = await updateStreamRoleAndNotify(
        args.permissionParams,
        context.userId!,
        context.resourceAccessRules
      )
      return !!result
    },

    async streamFavorite(_parent, args, ctx) {
      const { streamId, favorited } = args
      const { userId, resourceAccessRules } = ctx

      const stream = await favoriteStream({
        userId: userId!,
        streamId,
        favorited,
        userResourceAccessRules: resourceAccessRules
      })

      return stream
    },

    async streamLeave(_parent, args, ctx) {
      const { streamId } = args
      const { userId } = ctx

      await removeStreamCollaborator(
        streamId,
        userId!,
        userId!,
        ctx.resourceAccessRules
      )

      return true
    }
  },

  Subscription: {
    userStreamAdded: {
      subscribe: filteredSubscribe(
        StreamSubscriptions.UserStreamAdded,
        (payload, _variables, context) => {
          const hasResourceAccess = isResourceAllowed({
            resourceId: payload.userStreamAdded.id,
            resourceType: TokenResourceIdentifierType.Project,
            resourceAccessRules: context.resourceAccessRules
          })

          if (!hasResourceAccess) {
            return false
          }

          return payload.ownerId === context.userId
        }
      )
    },
    userStreamRemoved: {
      subscribe: filteredSubscribe(
        StreamSubscriptions.UserStreamRemoved,
        (payload, _variables, context) => {
          const hasResourceAccess = isResourceAllowed({
            resourceId: payload.userStreamRemoved.id,
            resourceType: TokenResourceIdentifierType.Project,
            resourceAccessRules: context.resourceAccessRules
          })
          if (!hasResourceAccess) {
            return false
          }

          return payload.ownerId === context.userId
        }
      )
    },

    streamUpdated: {
      subscribe: filteredSubscribe(
        StreamSubscriptions.StreamUpdated,
        async (payload, variables, context) => {
          await authorizeResolver(
            context.userId,
            payload.id,
            Roles.Stream.Reviewer,
            context.resourceAccessRules
          )
          return payload.id === variables.streamId
        }
      )
    },

    streamDeleted: {
      subscribe: filteredSubscribe(
        StreamSubscriptions.StreamDeleted,
        async (payload, variables, context) => {
          await authorizeResolver(
            context.userId,
            payload.streamId,
            Roles.Stream.Reviewer,
            context.resourceAccessRules
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
      return stream!.name
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
