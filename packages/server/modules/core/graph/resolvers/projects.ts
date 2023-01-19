import { Resolvers } from '@/modules/core/graph/generated/graphql'
import { Roles, Scopes } from '@/modules/core/helpers/mainConstants'
import {
  getUserStreamsCount,
  getUserStreams,
  getStreamCollaborators,
  getStream
} from '@/modules/core/repositories/streams'
import {
  deleteStreamAndNotify,
  updateStreamAndNotify
} from '@/modules/core/services/streams/management'
import { createOnboardingStream } from '@/modules/core/services/streams/onboarding'
import { authorizeResolver, validateScopes, validateServerRole } from '@/modules/shared'
import { NotFoundError } from '@/modules/shared/errors'
import {
  filteredSubscribe,
  ProjectSubscriptions,
  UserSubscriptions
} from '@/modules/shared/utils/subscriptions'
import { has } from 'lodash'

export = {
  Query: {
    async project(_parent, args, context) {
      const stream = await getStream({
        streamId: args.id,
        userId: context.userId
      })
      if (!stream) throw new NotFoundError('Project not found')

      await authorizeResolver(context.userId, args.id, Roles.Stream.Reviewer)

      if (!stream.isPublic) {
        await validateServerRole(context, Roles.Server.User)
        validateScopes(context.scopes, Scopes.Streams.Read)
      }

      return stream
    }
  },
  Mutation: {
    projectMutations: () => ({})
  },
  ProjectMutations: {
    async delete(_parent, { id }, { userId }) {
      await authorizeResolver(userId, id, Roles.Stream.Owner)
      return await deleteStreamAndNotify(id, userId!)
    },
    async createForOnboarding(_parent, _args, { userId }) {
      return await createOnboardingStream(userId!)
    },
    async update(_parent, { stream }, { userId }) {
      await authorizeResolver(userId, stream.id, Roles.Stream.Owner)
      return await updateStreamAndNotify(stream, userId!)
    }
  },
  User: {
    async projects(_parent, args, ctx) {
      const totalCount = await getUserStreamsCount({
        userId: ctx.userId!,
        forOtherUser: false,
        searchQuery: args.filter?.search || undefined
      })

      const { cursor, streams } = await getUserStreams({
        userId: ctx.userId!,
        limit: args.limit,
        cursor: args.cursor || undefined,
        searchQuery: args.filter?.search || undefined,
        forOtherUser: false
      })

      return { totalCount, cursor, items: streams }
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
      return users
    },
    async modelCount(parent, _args, ctx) {
      return await ctx.loaders.streams.getBranchCount.load(parent.id)
    },
    async versionCount(parent, _args, ctx) {
      return await ctx.loaders.streams.getCommitCountWithoutGlobals.load(parent.id)
    },
    async sourceApps(parent, _args, ctx) {
      return ctx.loaders.streams.getSourceApps.load(parent.id)
    }
  },
  Subscription: {
    userProjectsUpdated: {
      subscribe: filteredSubscribe(
        UserSubscriptions.UserProjectsUpdated,
        (payload, _args, ctx) => {
          return payload.ownerId === ctx.userId
        }
      )
    },
    projectUpdated: {
      subscribe: filteredSubscribe(
        ProjectSubscriptions.ProjectUpdated,
        async (payload, args, ctx) => {
          await authorizeResolver(
            ctx.userId,
            payload.projectUpdated.id,
            Roles.Stream.Reviewer
          )
          return args.id === payload.projectUpdated.id
        }
      )
    }
  }
} as Resolvers
