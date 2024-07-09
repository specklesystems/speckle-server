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
  getRateLimitResult,
  isRateLimitBreached
} = require('@/modules/core/services/ratelimiter')
const {
  getPendingStreamCollaboratorsFactory
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
const { RateLimitError } = require('@/modules/core/errors/ratelimit')

const {
  toProjectIdWhitelist,
  isResourceAllowed
} = require('@/modules/core/helpers/token')
const {
  TokenResourceIdentifierType
} = require('@/modules/core/graph/generated/graphql')
const {
  queryAllStreamInvitesFactory
} = require('@/modules/serverinvites/repositories/serverInvites')
const db = require('@/db/knex')
const { isWorkspacesModuleEnabled } = require('@/modules/core/helpers/features')
const { WorkspacesModuleDisabledError } = require('@/modules/core/errors/workspaces')

// subscription events
const USER_STREAM_ADDED = StreamPubsubEvents.UserStreamAdded
const USER_STREAM_REMOVED = StreamPubsubEvents.UserStreamRemoved
const STREAM_UPDATED = StreamPubsubEvents.StreamUpdated
const STREAM_DELETED = StreamPubsubEvents.StreamDeleted

const _deleteStream = async (_parent, args, context, options) => {
  const { skipAccessChecks = false } = options || {}
  return await deleteStreamAndNotify(
    args.id,
    context.userId,
    context.resourceAccessRules,
    { skipAccessChecks }
  )
}

const getUserStreamsCore = async (forOtherUser, parent, args, streamIdWhitelist) => {
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
module.exports = {
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
        userId: context.userId,
        searchQuery: args.query,
        streamIdWhitelist: toProjectIdWhitelist(context.resourceAccessRules)
      })

      const { cursor, streams } = await getUserStreams({
        userId: context.userId,
        limit: args.limit,
        cursor: args.cursor,
        searchQuery: args.query,
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

    async adminStreams(parent, args) {
      if (args.limit && args.limit > 50)
        throw new UserInputError('Cannot return more than 50 items at a time.')

      const { streams, totalCount } = await getStreams({
        offset: args.offset,
        limit: args.limit,
        orderBy: args.orderBy,
        publicOnly: args.publicOnly,
        searchQuery: args.query,
        visibility: args.visibility,
        streamIdWhitelist: toProjectIdWhitelist(args.resourceAccessRules)
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
      return await getPendingStreamCollaboratorsFactory({
        queryAllStreamInvites: queryAllStreamInvitesFactory({ db })
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
      if (has(parent, 'role')) return parent.role

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
        throw new UserInputError("Cannot view another user's favorite streams")

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
      const rateLimitResult = await getRateLimitResult('STREAM_CREATE', context.userId)
      if (isRateLimitBreached(rateLimitResult)) {
        throw new RateLimitError(rateLimitResult)
      }

      if (args.stream.workspaceId) {
        if (!isWorkspacesModuleEnabled()) {
          // Ugly but complete, will go away if/when resolver moved to workspaces module
          throw new WorkspacesModuleDisabledError()
        }
        await authorizeResolver(
          context.userId,
          args.stream.workspaceId,
          Roles.Workspace.Member,
          context.resourceAccessRules
        )
      }

      const { id } = await createStreamReturnRecord(
        {
          ...args.stream,
          ownerId: context.userId,
          ownerResourceAccessRules: context.resourceAccessRules
        },
        { createActivity: true }
      )

      return id
    },

    async streamUpdate(parent, args, context) {
      await updateStreamAndNotify(
        args.stream,
        context.userId,
        context.resourceAccessRules
      )
      return true
    },

    async streamDelete(parent, args, context) {
      return await _deleteStream(parent, args, context)
    },

    async streamsDelete(parent, args, context) {
      const results = await Promise.all(
        args.ids.map(async (id) => {
          const newArgs = { ...args }
          newArgs.id = id
          return await _deleteStream(parent, newArgs, context, {
            skipAccessChecks: true
          })
        })
      )
      return results.every((res) => res === true)
    },

    async streamUpdatePermission(parent, args, context) {
      const result = await updateStreamRoleAndNotify(
        args.permissionParams,
        context.userId,
        context.resourceAccessRules
      )
      return !!result
    },

    async streamRevokePermission(parent, args, context) {
      const result = await updateStreamRoleAndNotify(
        args.permissionParams,
        context.userId,
        context.resourceAccessRules
      )
      return !!result
    },

    async streamFavorite(_parent, args, ctx) {
      const { streamId, favorited } = args
      const { userId, resourceAccessRules } = ctx

      return await favoriteStream({
        userId,
        streamId,
        favorited,
        userResourceAccessRules: resourceAccessRules
      })
    },

    async streamLeave(_parent, args, ctx) {
      const { streamId } = args
      const { userId } = ctx

      await removeStreamCollaborator(streamId, userId, userId, ctx.resourceAccessRules)

      return true
    }
  },

  Subscription: {
    userStreamAdded: {
      subscribe: withFilter(
        () => pubsub.asyncIterator([USER_STREAM_ADDED]),
        (payload, variables, context) => {
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
      subscribe: withFilter(
        () => pubsub.asyncIterator([USER_STREAM_REMOVED]),
        (payload, variables, context) => {
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
      subscribe: withFilter(
        () => pubsub.asyncIterator([STREAM_UPDATED]),
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
      subscribe: withFilter(
        () => pubsub.asyncIterator([STREAM_DELETED]),
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
