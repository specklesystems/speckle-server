import { db } from '@/db/knex'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import {
  addStreamClonedActivityFactory,
  addStreamCreatedActivityFactory,
  addStreamDeletedActivityFactory,
  addStreamInviteAcceptedActivityFactory,
  addStreamPermissionsAddedActivityFactory,
  addStreamPermissionsRevokedActivityFactory,
  addStreamUpdatedActivityFactory
} from '@/modules/activitystream/services/streamActivity'
import {
  getBatchedStreamCommentsFactory,
  getCommentLinksFactory,
  insertCommentLinksFactory,
  insertCommentsFactory
} from '@/modules/comments/repositories/comments'
import { RateLimitError } from '@/modules/core/errors/ratelimit'
import { StreamNotFoundError } from '@/modules/core/errors/stream'
import { WorkspacesModuleDisabledError } from '@/modules/core/errors/workspaces'
import { ProjectsEmitter } from '@/modules/core/events/projectsEmitter'
import {
  ProjectVisibility,
  Resolvers,
  TokenResourceIdentifierType
} from '@/modules/core/graph/generated/graphql'
import { isWorkspacesModuleEnabled } from '@/modules/core/helpers/features'
import { Roles, Scopes, StreamRoles } from '@/modules/core/helpers/mainConstants'
import { isResourceAllowed, toProjectIdWhitelist } from '@/modules/core/helpers/token'
import {
  createBranchFactory,
  getBatchedStreamBranchesFactory,
  insertBranchesFactory
} from '@/modules/core/repositories/branches'
import {
  getBatchedBranchCommitsFactory,
  getBatchedStreamCommitsFactory,
  insertBranchCommitsFactory,
  insertCommitsFactory,
  insertStreamCommitsFactory
} from '@/modules/core/repositories/commits'
import {
  getStreamFactory,
  getStreamCollaboratorsFactory,
  createStreamFactory,
  deleteStreamFactory,
  updateStreamFactory,
  revokeStreamPermissionsFactory,
  grantStreamPermissionsFactory,
  getOnboardingBaseStreamFactory,
  getUserStreamsPageFactory,
  getUserStreamsCountFactory
} from '@/modules/core/repositories/streams'
import { getUser, getUsers } from '@/modules/core/repositories/users'
import {
  getRateLimitResult,
  isRateLimitBreached
} from '@/modules/core/services/ratelimiter'
import {
  addOrUpdateStreamCollaboratorFactory,
  isStreamCollaboratorFactory,
  removeStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import { cloneStreamFactory } from '@/modules/core/services/streams/clone'
import {
  createStreamReturnRecordFactory,
  deleteStreamAndNotifyFactory,
  updateStreamAndNotifyFactory,
  updateStreamRoleAndNotifyFactory
} from '@/modules/core/services/streams/management'
import { createOnboardingStreamFactory } from '@/modules/core/services/streams/onboarding'
import { getOnboardingBaseProjectFactory } from '@/modules/cross-server-sync/services/onboardingProject'
import {
  deleteAllResourceInvitesFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { authorizeResolver, validateScopes } from '@/modules/shared'
import { throwForNotHavingServerRole } from '@/modules/shared/authz'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  filteredSubscribe,
  ProjectSubscriptions,
  publish,
  UserSubscriptions
} from '@/modules/shared/utils/subscriptions'
import { has } from 'lodash'

const saveActivity = saveActivityFactory({ db })
const getStream = getStreamFactory({ db })
const getStreamCollaborators = getStreamCollaboratorsFactory({ db })
const createStreamReturnRecord = createStreamReturnRecordFactory({
  inviteUsersToProject: inviteUsersToProjectFactory({
    createAndSendInvite: createAndSendInviteFactory({
      findUserByTarget: findUserByTargetFactory(),
      insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
      collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory({
        getStream
      }),
      buildInviteEmailContents: buildCoreInviteEmailContentsFactory({
        getStream
      }),
      emitEvent: ({ eventName, payload }) =>
        getEventBus().emit({
          eventName,
          payload
        })
    }),
    getUsers
  }),
  createStream: createStreamFactory({ db }),
  createBranch: createBranchFactory({ db }),
  addStreamCreatedActivity: addStreamCreatedActivityFactory({
    saveActivity,
    publish
  }),
  projectsEventsEmitter: ProjectsEmitter.emit
})
const deleteStreamAndNotify = deleteStreamAndNotifyFactory({
  deleteStream: deleteStreamFactory({ db }),
  authorizeResolver,
  addStreamDeletedActivity: addStreamDeletedActivityFactory({
    saveActivity: saveActivityFactory({ db }),
    publish,
    getStreamCollaborators: getStreamCollaboratorsFactory({ db })
  }),
  deleteAllResourceInvites: deleteAllResourceInvitesFactory({ db })
})
const updateStreamAndNotify = updateStreamAndNotifyFactory({
  authorizeResolver,
  getStream,
  updateStream: updateStreamFactory({ db }),
  addStreamUpdatedActivity: addStreamUpdatedActivityFactory({ saveActivity, publish })
})
const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })
const isStreamCollaborator = isStreamCollaboratorFactory({
  getStream
})
const removeStreamCollaborator = removeStreamCollaboratorFactory({
  validateStreamAccess,
  isStreamCollaborator,
  revokeStreamPermissions: revokeStreamPermissionsFactory({ db }),
  addStreamPermissionsRevokedActivity: addStreamPermissionsRevokedActivityFactory({
    saveActivity,
    publish
  })
})
const updateStreamRoleAndNotify = updateStreamRoleAndNotifyFactory({
  isStreamCollaborator,
  addOrUpdateStreamCollaborator: addOrUpdateStreamCollaboratorFactory({
    validateStreamAccess,
    getUser,
    grantStreamPermissions: grantStreamPermissionsFactory({ db }),
    addStreamInviteAcceptedActivity: addStreamInviteAcceptedActivityFactory({
      saveActivity,
      publish
    }),
    addStreamPermissionsAddedActivity: addStreamPermissionsAddedActivityFactory({
      saveActivity,
      publish
    })
  }),
  removeStreamCollaborator
})

const updateStream = updateStreamFactory({ db })
const cloneStream = cloneStreamFactory({
  getStream: getStreamFactory({ db }),
  getUser,
  db,
  createStream: createStreamFactory({ db }),
  insertCommits: insertCommitsFactory({ db }),
  getBatchedStreamCommits: getBatchedStreamCommitsFactory({ db }),
  insertStreamCommits: insertStreamCommitsFactory({ db }),
  getBatchedStreamBranches: getBatchedStreamBranchesFactory({ db }),
  insertBranches: insertBranchesFactory({ db }),
  getBatchedBranchCommits: getBatchedBranchCommitsFactory({ db }),
  insertBranchCommits: insertBranchCommitsFactory({ db }),
  getBatchedStreamComments: getBatchedStreamCommentsFactory({ db }),
  insertComments: insertCommentsFactory({ db }),
  getCommentLinks: getCommentLinksFactory({ db }),
  insertCommentLinks: insertCommentLinksFactory({ db }),
  addStreamClonedActivity: addStreamClonedActivityFactory({
    saveActivity: saveActivityFactory({ db }),
    publish
  })
})

const createOnboardingStream = createOnboardingStreamFactory({
  getOnboardingBaseProject: getOnboardingBaseProjectFactory({
    getOnboardingBaseStream: getOnboardingBaseStreamFactory({ db })
  }),
  cloneStream,
  createStreamReturnRecord,
  getUser,
  updateStream
})
const getUserStreams = getUserStreamsPageFactory({ db })
const getUserStreamsCount = getUserStreamsCountFactory({ db })

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
