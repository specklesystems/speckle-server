import { db } from '@/db/knex'
import {
  getBatchedStreamCommentsFactory,
  getCommentLinksFactory,
  insertCommentLinksFactory,
  insertCommentsFactory
} from '@/modules/comments/repositories/comments'
import { RateLimitError } from '@/modules/core/errors/ratelimit'
import {
  ProjectVisibility,
  Resolvers,
  TokenResourceIdentifierType
} from '@/modules/core/graph/generated/graphql'
import { Roles, Scopes, StreamRoles } from '@/modules/core/helpers/mainConstants'
import {
  isResourceAllowed,
  throwIfNewResourceNotAllowed,
  throwIfResourceAccessNotAllowed,
  toProjectIdWhitelist
} from '@/modules/core/helpers/token'
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
import { storeModelFactory } from '@/modules/core/repositories/models'
import {
  deleteProjectFactory,
  getProjectFactory,
  storeProjectFactory,
  storeProjectRoleFactory
} from '@/modules/core/repositories/projects'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
  getStreamFactory,
  createStreamFactory,
  deleteStreamFactory,
  updateStreamFactory,
  revokeStreamPermissionsFactory,
  grantStreamPermissionsFactory,
  getOnboardingBaseStreamFactory,
  getUserStreamsPageFactory,
  getUserStreamsCountFactory
} from '@/modules/core/repositories/streams'
import { getUserFactory, getUsersFactory } from '@/modules/core/repositories/users'
import { createNewProjectFactory } from '@/modules/core/services/projects'
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
  getDb,
  getProjectDbClient,
  getValidDefaultProjectRegionKey
} from '@/modules/multiregion/utils/dbSelector'
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
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  filteredSubscribe,
  ProjectSubscriptions,
  UserSubscriptions
} from '@/modules/shared/utils/subscriptions'
import { has } from 'lodash'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'

const getServerInfo = getServerInfoFactory({ db })
const getUsers = getUsersFactory({ db })
const getUser = getUserFactory({ db })
const getStream = getStreamFactory({ db })
const createStreamReturnRecord = createStreamReturnRecordFactory({
  inviteUsersToProject: inviteUsersToProjectFactory({
    createAndSendInvite: createAndSendInviteFactory({
      findUserByTarget: findUserByTargetFactory({ db }),
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
        }),
      getUser,
      getServerInfo
    }),
    getUsers
  }),
  createStream: createStreamFactory({ db }),
  createBranch: createBranchFactory({ db }),
  emitEvent: getEventBus().emit
})
const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })
const isStreamCollaborator = isStreamCollaboratorFactory({
  getStream
})
const removeStreamCollaborator = removeStreamCollaboratorFactory({
  validateStreamAccess,
  isStreamCollaborator,
  revokeStreamPermissions: revokeStreamPermissionsFactory({ db }),
  emitEvent: getEventBus().emit
})
const updateStreamRoleAndNotify = updateStreamRoleAndNotifyFactory({
  isStreamCollaborator,
  addOrUpdateStreamCollaborator: addOrUpdateStreamCollaboratorFactory({
    validateStreamAccess,
    getUser,
    grantStreamPermissions: grantStreamPermissionsFactory({ db }),
    emitEvent: getEventBus().emit
  }),
  removeStreamCollaborator
})

const updateStream = updateStreamFactory({ db })
const cloneStream = cloneStreamFactory({
  getStream: getStreamFactory({ db }),
  getUser,
  newProjectDb: db,
  sourceProjectDb: db,
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
  emitEvent: getEventBus().emit
})

// We want to read & write from main DB - this isn't occurring in a multi region workspace ctx
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
      const canQuery = await context.authPolicies.project.canRead({
        projectId: args.id,
        userId: context.userId
      })
      throwIfAuthNotOk(canQuery)

      const project = await getStream({ streamId: args.id })

      // TODO: Should scopes & token resource access rules be checked in authz policy?
      if (!project?.isPublic && !project?.isDiscoverable) {
        await validateScopes(context.scopes, Scopes.Streams.Read)
      }

      return project
    }
  },
  Mutation: {
    projectMutations: () => ({})
  },
  ProjectMutations: {
    async batchDelete(_parent, args, ctx) {
      args.ids.forEach((id) => {
        throwIfResourceAccessNotAllowed({
          resourceId: id,
          resourceType: TokenResourceIdentifierType.Project,
          resourceAccessRules: ctx.resourceAccessRules
        })
      })

      const results = await Promise.all(
        args.ids.map(async (id) => {
          const projectDb = await getProjectDbClient({ projectId: id })
          const deleteStreamAndNotify = deleteStreamAndNotifyFactory({
            deleteStream: deleteStreamFactory({
              db: projectDb
            }),
            emitEvent: getEventBus().emit,
            deleteAllResourceInvites: deleteAllResourceInvitesFactory({ db }),
            getStream: getStreamFactory({ db: projectDb })
          })
          return deleteStreamAndNotify(id, ctx.userId!)
        })
      )
      return results.every((res) => res === true)
    },
    async delete(
      _parent,
      { id: projectId },
      { userId, resourceAccessRules, authPolicies }
    ) {
      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules
      })

      const canUpdate = await authPolicies.project.canUpdate({
        projectId,
        userId
      })
      throwIfAuthNotOk(canUpdate)

      const projectDb = await getProjectDbClient({ projectId })
      const deleteStreamAndNotify = deleteStreamAndNotifyFactory({
        deleteStream: deleteStreamFactory({
          db: projectDb
        }),
        emitEvent: getEventBus().emit,
        deleteAllResourceInvites: deleteAllResourceInvitesFactory({ db }),
        getStream: getStreamFactory({ db: projectDb })
      })
      return await deleteStreamAndNotify(projectId, userId!)
    },
    async createForOnboarding(_parent, _args, { userId, resourceAccessRules, log }) {
      return await createOnboardingStream({
        targetUserId: userId!,
        targetUserResourceAccessRules: resourceAccessRules,
        logger: log
      })
    },
    async update(
      _parent,
      { update },
      { userId, resourceAccessRules, authPolicies, clearCache }
    ) {
      throwIfResourceAccessNotAllowed({
        resourceId: update.id,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules
      })

      const canUpdate = await authPolicies.project.canUpdate({
        projectId: update.id,
        userId
      })
      throwIfAuthNotOk(canUpdate)

      const projectDB = await getProjectDbClient({ projectId: update.id })
      const updateStreamAndNotify = updateStreamAndNotifyFactory({
        getStream: getStreamFactory({ db: projectDB }),
        updateStream: updateStreamFactory({ db: projectDB }),
        emitEvent: getEventBus().emit
      })
      const res = await updateStreamAndNotify(update, userId!)

      // Reset loader cache
      await clearCache()

      return res
    },
    // This one is only used outside of a workspace, so the project is always created in the main db
    async create(_parent, args, context) {
      const rateLimitResult = await getRateLimitResult('STREAM_CREATE', context.userId!)
      if (isRateLimitBreached(rateLimitResult)) {
        throw new RateLimitError(rateLimitResult)
      }

      throwIfNewResourceNotAllowed({
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: context.resourceAccessRules
      })
      const canCreate = await context.authPolicies.project.canCreatePersonal({
        userId: context.userId
      })
      throwIfAuthNotOk(canCreate)

      const regionKey = await getValidDefaultProjectRegionKey()
      const projectDb = await getDb({ regionKey })

      const createNewProject = createNewProjectFactory({
        storeProject: storeProjectFactory({ db: projectDb }),
        getProject: getProjectFactory({ db }),
        deleteProject: deleteProjectFactory({ db: projectDb }),
        storeModel: storeModelFactory({ db: projectDb }),
        // THIS MUST GO TO THE MAIN DB
        storeProjectRole: storeProjectRoleFactory({ db }),
        emitEvent: getEventBus().emit
      })

      const project = await createNewProject({
        ...(args.input || {}),
        ownerId: context.userId!,
        regionKey
      })

      return project
    },
    async updateRole(_parent, args, ctx) {
      await authorizeResolver(
        ctx.userId,
        args.input.projectId,
        Roles.Stream.Owner,
        ctx.resourceAccessRules
      )
      const ret = await updateStreamRoleAndNotify(
        args.input,
        ctx.userId!,
        ctx.resourceAccessRules
      )

      // Reset loader cache
      ctx.clearCache()

      return ret
    },
    async leave(_parent, args, context) {
      throwIfResourceAccessNotAllowed({
        resourceId: args.id,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: context.resourceAccessRules
      })

      const canLeave = await context.authPolicies.project.canLeave({
        projectId: args.id,
        userId: context.userId
      })
      throwIfAuthNotOk(canLeave)

      const { id } = args
      const { userId } = context
      await removeStreamCollaborator(id, userId!, userId!, context.resourceAccessRules)

      // Reset loader cache
      context.clearCache()

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

      const [totalCount, visibleCount, { cursor, streams }] = await Promise.all([
        getUserStreamsCount({
          userId: ctx.userId!,
          forOtherUser: false,
          searchQuery: args.filter?.search || undefined,
          withRoles: (args.filter?.onlyWithRoles || []) as StreamRoles[],
          streamIdWhitelist: toProjectIdWhitelist(ctx.resourceAccessRules),
          workspaceId: args.filter?.workspaceId,
          personalOnly: args.filter?.personalOnly
        }),
        getUserStreamsCount({
          userId: ctx.userId!,
          forOtherUser: false,
          searchQuery: args.filter?.search || undefined,
          withRoles: (args.filter?.onlyWithRoles || []) as StreamRoles[],
          streamIdWhitelist: toProjectIdWhitelist(ctx.resourceAccessRules),
          onlyWithActiveSsoSession: true,
          workspaceId: args.filter?.workspaceId,
          personalOnly: args.filter?.personalOnly
        }),
        getUserStreams({
          userId: ctx.userId!,
          limit: args.limit,
          cursor: args.cursor || undefined,
          searchQuery: args.filter?.search || undefined,
          forOtherUser: false,
          withRoles: (args.filter?.onlyWithRoles || []) as StreamRoles[],
          streamIdWhitelist: toProjectIdWhitelist(ctx.resourceAccessRules),
          onlyWithActiveSsoSession: true,
          workspaceId: args.filter?.workspaceId,
          personalOnly: args.filter?.personalOnly
        })
      ])

      return {
        totalCount,
        numberOfHidden: totalCount - visibleCount,
        cursor,
        items: streams
      }
    }
  },
  Project: {
    async role(parent, _args, ctx) {
      // If role already resolved, return that
      if (has(parent, 'role')) return parent.role

      return await ctx.loaders.streams.getRole.load(parent.id)
    },
    async team(parent, _args, ctx) {
      const users = await ctx.loaders.streams.getCollaborators.load(parent.id)
      return users.map((u) => ({
        user: u,
        role: u.streamRole,
        id: u.id,
        projectId: parent.id
      }))
    },
    async sourceApps(parent, _args, ctx) {
      const projectDB = await getProjectDbClient({ projectId: parent.id })
      return (
        ctx.loaders
          .forRegion({ db: projectDB })
          .streams.getSourceApps.load(parent.id) || []
      )
    },

    async visibility(parent) {
      const { isPublic } = parent

      // Ignore discoverability for now
      return isPublic ? ProjectVisibility.Unlisted : ProjectVisibility.Private
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

          throwIfResourceAccessNotAllowed({
            resourceId: payload.projectUpdated.id,
            resourceType: TokenResourceIdentifierType.Project,
            resourceAccessRules: ctx.resourceAccessRules
          })

          const canRead = await ctx.authPolicies.project.canRead({
            projectId: payload.projectUpdated.id,
            userId: ctx.userId
          })
          throwIfAuthNotOk(canRead)

          return true
        }
      )
    }
  }
} as Resolvers
