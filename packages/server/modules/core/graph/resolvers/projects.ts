import { db } from '@/db/knex'
import {
  BranchCommits,
  Branches,
  Commits,
  Objects,
  StreamAcl,
  Streams
} from '@/modules/core/dbSchema'
import { RateLimitError } from '@/modules/core/errors/ratelimit'
import { StreamNotFoundError } from '@/modules/core/errors/stream'
import { WorkspacesModuleDisabledError } from '@/modules/core/errors/workspaces'
import {
  ProjectVisibility,
  Resolvers,
  TokenResourceIdentifierType
} from '@/modules/core/graph/generated/graphql'
import { isWorkspacesModuleEnabled } from '@/modules/core/helpers/features'
import { Roles, Scopes, StreamRoles } from '@/modules/core/helpers/mainConstants'
import { isResourceAllowed, toProjectIdWhitelist } from '@/modules/core/helpers/token'
import { createBranchFactory } from '@/modules/core/repositories/branches'
import {
  getUserStreamsCount,
  getUserStreams,
  getStreamCollaborators,
  getStream
} from '@/modules/core/repositories/streams'
import { createCommitByBranchId } from '@/modules/core/services/commit/management'
import {
  getRateLimitResult,
  isRateLimitBreached
} from '@/modules/core/services/ratelimiter'
import { cloneStream } from '@/modules/core/services/streams/clone'
import {
  createStreamReturnRecord,
  deleteStreamAndNotify,
  updateStreamAndNotify,
  updateStreamRoleAndNotify
} from '@/modules/core/services/streams/management'
import { createOnboardingStream } from '@/modules/core/services/streams/onboarding'
import { removeStreamCollaborator } from '@/modules/core/services/streams/streamAccessService'
import { authorizeResolver, validateScopes } from '@/modules/shared'
import { throwForNotHavingServerRole } from '@/modules/shared/authz'
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
    async load(_parend, args, ctx) {
      const source = await db('streams')
        .join(StreamAcl.name, StreamAcl.col.resourceId, Streams.col.id)
        .where({ name: 'Hackathon_2024', userId: ctx.userId })
        .first()
      const branches = await db('branches').where({ streamId: args.id })

      const objects = await db('branches')
        .join(BranchCommits.name, BranchCommits.col.branchId, Branches.col.id)
        .join(Commits.name, Commits.col.id, BranchCommits.col.commitId)
        .join(Objects.name, Objects.col.id, Commits.col.referencedObject)
        .where(Branches.col.streamId, source.id)

      for (const object of objects) {
        const branchName = object.name

        const branch = branches.find((b) => b.name === branchName)

        if (!branch) continue
        await createCommitByBranchId({
          authorId: ctx.userId!,
          streamId: args.id,
          branchId: branch.id,
          message: null,
          sourceApplication: null,
          objectId: object.id,
          parents: []
        })
      }

      return true
    },
    async batchDelete(_parent, args, ctx) {
      const results = await Promise.all(
        args.ids.map((id) =>
          deleteStreamAndNotify(id, ctx.userId!, ctx.resourceAccessRules, {
            skipAccessChecks: true
          })
        )
      )
      return results.every((res) => res === true)
    },
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

      if (!!args.input?.workspaceId) {
        if (!isWorkspacesModuleEnabled()) {
          // Ugly but complete, will go away if/when resolver moved to workspaces module
          throw new WorkspacesModuleDisabledError()
        }
        await authorizeResolver(
          context.userId!,
          args.input.workspaceId,
          Roles.Workspace.Member,
          context.resourceAccessRules
        )
      }

      const project = await createStreamReturnRecord(
        {
          ...(args.input || {}),
          ownerId: context.userId!,
          ownerResourceAccessRules: context.resourceAccessRules
        },
        { createActivity: true, templateId: args.input?.templateId ?? undefined }
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
  User: {
    async projects(_parent, args, ctx) {
      // If limit=0 & no filter, short-cut full execution and use data loader
      if (!args.filter && args.limit === 0) {
        return {
          totalCount: await ctx.loaders.users.getOwnStreamCount.load(ctx.userId!),
          items: [],
          cursor: null
        }
      }

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
        role: u.streamRole,
        id: u.id
      }))
    },
    async sourceApps(parent, _args, ctx) {
      return ctx.loaders.streams.getSourceApps.load(parent.id) || []
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
