import { db } from '@/db/knex'
import {
  getBatchedStreamCommentsFactory,
  getCommentLinksFactory,
  insertCommentLinksFactory,
  insertCommentsFactory
} from '@/modules/comments/repositories/comments'
import {
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
import { throwIfRateLimitedFactory } from '@/modules/core/utils/ratelimiter'
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
  deleteInvitesByTargetFactory,
  deleteServerOnlyInvitesFactory,
  findInviteFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import { collectAndValidateCoreTargetsFactory } from '@/modules/serverinvites/services/coreResourceCollection'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import { inviteUsersToProjectFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { authorizeResolver, validateScopes } from '@/modules/shared'
import { isRateLimiterEnabled } from '@/modules/shared/helpers/envHelper'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  filteredSubscribe,
  ProjectSubscriptions,
  UserSubscriptions
} from '@/modules/shared/utils/subscriptions'
import { has } from 'lodash'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import { withOperationLogging } from '@/observability/domain/businessLogging'
import {
  finalizeInvitedServerRegistrationFactory,
  finalizeResourceInviteFactory
} from '@/modules/serverinvites/services/processing'
import {
  processFinalizedProjectInviteFactory,
  validateProjectInviteBeforeFinalizationFactory
} from '@/modules/serverinvites/services/coreFinalization'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory
} from '@/modules/core/repositories/userEmails'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { ProjectRecordVisibility } from '@/modules/core/helpers/types'
import { mapDbToGqlProjectVisibility } from '@/modules/core/helpers/project'

const getServerInfo = getServerInfoFactory({ db })
const getUsers = getUsersFactory({ db })
const getUser = getUserFactory({ db })
const getStream = getStreamFactory({ db })

const buildFinalizeProjectInvite = () =>
  finalizeResourceInviteFactory({
    findInvite: findInviteFactory({ db }),
    validateInvite: validateProjectInviteBeforeFinalizationFactory({
      getProject: getStream
    }),
    processInvite: processFinalizedProjectInviteFactory({
      getProject: getStream,
      addProjectRole: addOrUpdateStreamCollaboratorFactory({
        validateStreamAccess: validateStreamAccessFactory({ authorizeResolver }),
        getUser,
        grantStreamPermissions: grantStreamPermissionsFactory({ db }),
        emitEvent: getEventBus().emit
      })
    }),
    deleteInvitesByTarget: deleteInvitesByTargetFactory({ db }),
    insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
    emitEvent: (...args) => getEventBus().emit(...args),
    findEmail: findEmailFactory({ db }),
    validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
      createUserEmail: createUserEmailFactory({ db }),
      ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
      findEmail: findEmailFactory({ db }),
      updateEmailInvites: finalizeInvitedServerRegistrationFactory({
        deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
        updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
      }),
      requestNewEmailVerification: requestNewEmailVerificationFactory({
        findEmail: findEmailFactory({ db }),
        getUser,
        getServerInfo,
        deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({
          db
        }),
        renderEmail,
        sendEmail
      })
    }),
    collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory({
      getStream
    }),
    getUser,
    getServerInfo
  })

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
      getServerInfo,
      finalizeInvite: buildFinalizeProjectInvite()
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
const throwIfRateLimited = throwIfRateLimitedFactory({
  rateLimiterEnabled: isRateLimiterEnabled()
})

export = {
  Query: {
    async project(_parent, args, context) {
      throwIfResourceAccessNotAllowed({
        resourceId: args.id,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: context.resourceAccessRules
      })

      const canQuery = await context.authPolicies.project.canRead({
        projectId: args.id,
        userId: context.userId
      })
      throwIfAuthNotOk(canQuery)

      const project = await getStream({ streamId: args.id })

      if (project?.visibility !== ProjectRecordVisibility.Public) {
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
      await Promise.all(
        args.ids.map(async (id) => {
          throwIfResourceAccessNotAllowed({
            resourceId: id,
            resourceType: TokenResourceIdentifierType.Project,
            resourceAccessRules: ctx.resourceAccessRules
          })

          const canDelete = await ctx.authPolicies.project.canDelete({
            projectId: id,
            userId: ctx.userId
          })
          throwIfAuthNotOk(canDelete)
        })
      )

      const results = await withOperationLogging(
        async () =>
          await Promise.all(
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
          ),
        {
          logger: ctx.log,
          operationName: 'projectBatchDelete',
          operationDescription: `Delete multiple projects`
        }
      )
      return results.every((res) => res === true)
    },
    async delete(
      _parent,
      { id: projectId },
      { userId, resourceAccessRules, authPolicies, log: ctxLogger }
    ) {
      throwIfResourceAccessNotAllowed({
        resourceId: projectId,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules
      })

      const logger = ctxLogger.child({
        projectId,
        streamId: projectId //legacy
      })

      const canDelete = await authPolicies.project.canDelete({
        projectId,
        userId
      })
      throwIfAuthNotOk(canDelete)

      const projectDb = await getProjectDbClient({ projectId })
      const deleteStreamAndNotify = deleteStreamAndNotifyFactory({
        deleteStream: deleteStreamFactory({
          db: projectDb
        }),
        emitEvent: getEventBus().emit,
        deleteAllResourceInvites: deleteAllResourceInvitesFactory({ db }),
        getStream: getStreamFactory({ db: projectDb })
      })
      return await withOperationLogging(
        async () => await deleteStreamAndNotify(projectId, userId!),
        {
          logger,
          operationName: 'projectDelete',
          operationDescription: `Delete a project`
        }
      )
    },
    async createForOnboarding(_parent, _args, { userId, resourceAccessRules, log }) {
      return await withOperationLogging(
        async () =>
          await createOnboardingStream({
            targetUserId: userId!,
            targetUserResourceAccessRules: resourceAccessRules,
            logger: log
          }),
        {
          logger: log,
          operationName: 'createOnboardingProject',
          operationDescription: `Create a project for onboarding`
        }
      )
    },
    async update(
      _parent,
      { update },
      { userId, resourceAccessRules, authPolicies, clearCache, log: ctxLogger }
    ) {
      const projectId = update.id
      throwIfResourceAccessNotAllowed({
        resourceId: update.id,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules
      })

      const logger = ctxLogger.child({
        projectId,
        streamId: projectId //legacy
      })

      const canUpdate = await authPolicies.project.canUpdate({
        projectId,
        userId
      })
      throwIfAuthNotOk(canUpdate)

      const projectDB = await getProjectDbClient({ projectId })
      const updateStreamAndNotify = updateStreamAndNotifyFactory({
        getStream: getStreamFactory({ db: projectDB }),
        updateStream: updateStreamFactory({ db: projectDB }),
        emitEvent: getEventBus().emit
      })
      const res = await withOperationLogging(
        async () => await updateStreamAndNotify(update, userId!),
        {
          logger,
          operationName: 'projectUpdate',
          operationDescription: `Update a project`
        }
      )

      // Reset loader cache
      await clearCache()

      return res
    },
    // This one is only used outside of a workspace, so the project is always created in the main db
    async create(_parent, args, context) {
      await throwIfRateLimited({
        action: 'STREAM_CREATE',
        source: context.userId!
      })

      const logger = context.log

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

      const project = await withOperationLogging(
        async () =>
          await createNewProject({
            ...(args.input || {}),
            ownerId: context.userId!,
            regionKey
          }),
        {
          logger,
          operationName: 'projectCreate',
          operationDescription: `Create a new project`
        }
      )

      return project
    },
    async updateRole(_parent, args, ctx) {
      const projectId = args.input.projectId
      await authorizeResolver(
        ctx.userId,
        projectId,
        Roles.Stream.Owner,
        ctx.resourceAccessRules
      )

      const logger = ctx.log.child({
        projectId,
        streamId: projectId //legacy
      })

      const ret = await withOperationLogging(
        async () =>
          await updateStreamRoleAndNotify(
            args.input,
            ctx.userId!,
            ctx.resourceAccessRules
          ),
        {
          logger,
          operationName: 'projectUpdateRole',
          operationDescription: `Update a project role`
        }
      )

      // Reset loader cache
      ctx.clearCache()

      return ret
    },
    async leave(_parent, args, context) {
      const projectId = args.id
      throwIfResourceAccessNotAllowed({
        resourceId: args.id,
        resourceType: TokenResourceIdentifierType.Project,
        resourceAccessRules: context.resourceAccessRules
      })

      const logger = context.log.child({
        projectId,
        streamId: projectId //legacy
      })

      const canLeave = await context.authPolicies.project.canLeave({
        projectId,
        userId: context.userId
      })
      throwIfAuthNotOk(canLeave)

      const { id } = args
      const { userId } = context
      await withOperationLogging(
        async () =>
          await removeStreamCollaborator(
            id,
            userId!,
            userId!,
            context.resourceAccessRules
          ),
        {
          logger,
          operationName: 'projectLeave',
          operationDescription: `Leave a project`
        }
      )

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
          personalOnly: args.filter?.personalOnly,
          includeImplicitAccess: args.filter?.includeImplicitAccess
        }),
        getUserStreamsCount({
          userId: ctx.userId!,
          forOtherUser: false,
          searchQuery: args.filter?.search || undefined,
          withRoles: (args.filter?.onlyWithRoles || []) as StreamRoles[],
          streamIdWhitelist: toProjectIdWhitelist(ctx.resourceAccessRules),
          onlyWithActiveSsoSession: true,
          workspaceId: args.filter?.workspaceId,
          personalOnly: args.filter?.personalOnly,
          includeImplicitAccess: args.filter?.includeImplicitAccess
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
          personalOnly: args.filter?.personalOnly,
          sortBy: args.sortBy || undefined,
          includeImplicitAccess: args.filter?.includeImplicitAccess
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
      const { visibility } = parent
      return mapDbToGqlProjectVisibility(visibility)
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
