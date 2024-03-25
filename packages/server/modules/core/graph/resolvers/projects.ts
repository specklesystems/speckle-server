import { RateLimitError } from '@/modules/core/errors/ratelimit'
import { StreamNotFoundError } from '@/modules/core/errors/stream'
import {
  ProjectVisibility,
  Resolvers,
  TokenResourceIdentifierType
} from '@/modules/core/graph/generated/graphql'
import { Roles, Scopes, StreamRoles } from '@/modules/core/helpers/mainConstants'
import { isResourceAllowed, toProjectIdWhitelist } from '@/modules/core/helpers/token'
import {
  getUserStreamsCount,
  getUserStreams,
  getStreamCollaborators,
  getStream
} from '@/modules/core/repositories/streams'
import {
  getRateLimitResult,
  isRateLimitBreached
} from '@/modules/core/services/ratelimiter'
import {
  createStreamReturnRecord,
  deleteStreamAndNotify,
  updateStreamAndNotify,
  updateStreamRoleAndNotify
} from '@/modules/core/services/streams/management'
import { createOnboardingStream } from '@/modules/core/services/streams/onboarding'
import { removeStreamCollaborator } from '@/modules/core/services/streams/streamAccessService'
import { InviteCreateValidationError } from '@/modules/serverinvites/errors'
import { cancelStreamInvite } from '@/modules/serverinvites/services/inviteProcessingService'
import {
  getPendingStreamCollaborators,
  getUserPendingStreamInvites
} from '@/modules/serverinvites/services/inviteRetrievalService'
import {
  createStreamInviteAndNotify,
  useStreamInviteAndNotify
} from '@/modules/serverinvites/services/management'
import { authorizeResolver, validateScopes } from '@/modules/shared'
import { throwForNotHavingServerRole } from '@/modules/shared/authz'
import {
  filteredSubscribe,
  ProjectSubscriptions,
  UserSubscriptions
} from '@/modules/shared/utils/subscriptions'
import { chunk, has } from 'lodash'

export = {
  Query: {
    async project(_parent, args, context) {
      const stream = await getStream({
        streamId: args.id,
        userId: context.userId
      })
      if (!stream) {
        throw new StreamNotFoundError('Project not found')
      }

      await authorizeResolver(
        context.userId,
        args.id,
        Roles.Stream.Reviewer,
        context.resourceAccessRules
      )

      if (!stream.isPublic) {
        await throwForNotHavingServerRole(context, Roles.Server.Guest)
        validateScopes(context.scopes, Scopes.Streams.Read)
      }

      return stream
    }
  },
  Mutation: {
    projectMutations: () => ({})
  },
  ProjectMutations: {
    async delete(_parent, { id }, { userId, resourceAccessRules }) {
      return await deleteStreamAndNotify(id, userId!, resourceAccessRules)
    },
    async createForOnboarding(_parent, _args, { userId, resourceAccessRules }) {
      return await createOnboardingStream(userId!, resourceAccessRules)
    },
    async update(_parent, { update }, { userId, resourceAccessRules }) {
      return await updateStreamAndNotify(update, userId!, resourceAccessRules)
    },
    async create(_parent, args, context) {
      const rateLimitResult = await getRateLimitResult('STREAM_CREATE', context.userId!)
      if (isRateLimitBreached(rateLimitResult)) {
        throw new RateLimitError(rateLimitResult)
      }

      const project = await createStreamReturnRecord(
        {
          ...(args.input || {}),
          ownerId: context.userId!,
          ownerResourceAccessRules: context.resourceAccessRules
        },
        { createActivity: true }
      )

      return project
    },
    async updateRole(_parent, args, ctx) {
      await authorizeResolver(
        ctx.userId,
        args.input.projectId,
        Roles.Stream.Owner,
        ctx.resourceAccessRules
      )
      return await updateStreamRoleAndNotify(
        args.input,
        ctx.userId!,
        ctx.resourceAccessRules
      )
    },
    async leave(_parent, args, context) {
      const { id } = args
      const { userId } = context
      await removeStreamCollaborator(id, userId!, userId!, context.resourceAccessRules)
      return true
    },
    invites: () => ({})
  },
  ProjectInviteMutations: {
    async create(_parent, args, ctx) {
      await authorizeResolver(
        ctx.userId!,
        args.projectId,
        Roles.Stream.Owner,
        ctx.resourceAccessRules
      )
      await createStreamInviteAndNotify(
        {
          ...args.input,
          projectId: args.projectId
        },
        ctx.userId!,
        ctx.resourceAccessRules
      )
      return ctx.loaders.streams.getStream.load(args.projectId)
    },
    async batchCreate(_parent, args, ctx) {
      await authorizeResolver(
        ctx.userId!,
        args.projectId,
        Roles.Stream.Owner,
        ctx.resourceAccessRules
      )

      const inviteCount = args.input.length
      if (inviteCount > 10 && ctx.role !== Roles.Server.Admin) {
        throw new InviteCreateValidationError(
          'Maximum 10 invites can be sent at once by non admins'
        )
      }

      const inputBatches = chunk(args.input, 10)
      for (const batch of inputBatches) {
        await Promise.all(
          batch.map((i) =>
            createStreamInviteAndNotify(
              { ...i, projectId: args.projectId },
              ctx.userId!,
              ctx.resourceAccessRules
            )
          )
        )
      }
      return ctx.loaders.streams.getStream.load(args.projectId)
    },
    async use(_parent, args, ctx) {
      await useStreamInviteAndNotify(args.input, ctx.userId!, ctx.resourceAccessRules)
      return true
    },
    async cancel(_parent, args, ctx) {
      await authorizeResolver(
        ctx.userId,
        args.projectId,
        Roles.Stream.Owner,
        ctx.resourceAccessRules
      )
      await cancelStreamInvite(args.projectId, args.inviteId)
      return ctx.loaders.streams.getStream.load(args.projectId)
    }
  },
  User: {
    async projects(_parent, args, ctx) {
      const totalCount = await getUserStreamsCount({
        userId: ctx.userId!,
        forOtherUser: false,
        searchQuery: args.filter?.search || undefined,
        withRoles: (args.filter?.onlyWithRoles || []) as StreamRoles[],
        streamIdWhitelist: toProjectIdWhitelist(ctx.resourceAccessRules)
      })

      const { cursor, streams } = await getUserStreams({
        userId: ctx.userId!,
        limit: args.limit,
        cursor: args.cursor || undefined,
        searchQuery: args.filter?.search || undefined,
        forOtherUser: false,
        withRoles: (args.filter?.onlyWithRoles || []) as StreamRoles[],
        streamIdWhitelist: toProjectIdWhitelist(ctx.resourceAccessRules)
      })

      return { totalCount, cursor, items: streams }
    },
    async projectInvites(_parent, _args, context) {
      const { userId } = context
      return await getUserPendingStreamInvites(userId!)
    }
  },
  Project: {
    async role(parent, _args, ctx) {
      // If role already resolved, return that
      if (has(parent, 'role')) return parent.role

      return await ctx.loaders.streams.getRole.load(parent.id)
    },
    async team(parent) {
      const users = await getStreamCollaborators(parent.id)
      return users.map((u) => ({
        user: u,
        role: u.role
      }))
    },
    async sourceApps(parent, _args, ctx) {
      return ctx.loaders.streams.getSourceApps.load(parent.id) || []
    },
    async invitedTeam(parent) {
      return await getPendingStreamCollaborators(parent.id)
    },
    async visibility(parent) {
      const { isPublic, isDiscoverable } = parent
      if (!isPublic) return ProjectVisibility.Private
      return isDiscoverable ? ProjectVisibility.Public : ProjectVisibility.Unlisted
    }
  },
  PendingStreamCollaborator: {
    async projectId(parent) {
      return parent.streamId
    },
    async projectName(parent, _args, ctx) {
      const { streamId } = parent
      const stream = await ctx.loaders.streams.getStream.load(streamId)
      return stream?.name || ''
    }
  },
  Subscription: {
    userProjectsUpdated: {
      subscribe: filteredSubscribe(
        UserSubscriptions.UserProjectsUpdated,
        (payload, _args, ctx) => {
          const hasResourceAccess = isResourceAllowed({
            resourceId: payload.userProjectsUpdated.id,
            resourceType: TokenResourceIdentifierType.Project,
            resourceAccessRules: ctx.resourceAccessRules
          })
          if (!hasResourceAccess) {
            return false
          }

          return payload.ownerId === ctx.userId
        }
      )
    },
    projectUpdated: {
      subscribe: filteredSubscribe(
        ProjectSubscriptions.ProjectUpdated,
        async (payload, args, ctx) => {
          if (args.id !== payload.projectUpdated.id) return false
          await authorizeResolver(
            ctx.userId,
            payload.projectUpdated.id,
            Roles.Stream.Reviewer,
            ctx.resourceAccessRules
          )
          return true
        }
      )
    }
  }
} as Resolvers
