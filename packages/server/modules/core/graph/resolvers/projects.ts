import { db } from '@/db/knex'
import {
  getBatchedStreamCommentsFactory,
  getCommentLinksFactory,
  insertCommentLinksFactory,
  insertCommentsFactory
} from '@/modules/comments/repositories/comments'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { TokenResourceIdentifierType } from '@/modules/core/graph/generated/graphql'
import type { StreamRoles } from '@/modules/core/helpers/mainConstants'
import { Roles, Scopes } from '@/modules/core/helpers/mainConstants'
import {
  isResourceAllowed,
  throwIfNewResourceNotAllowed,
  throwIfResourceAccessNotAllowed,
  toProjectIdWhitelist
} from '@/modules/core/helpers/token'
import {
  getBatchedStreamBranchesFactory,
  insertBranchesFactory
} from '@/modules/core/repositories/branches'
import {
  deleteProjectCommitsFactory,
  getBatchedBranchCommitsFactory,
  getBatchedStreamCommitsFactory,
  insertBranchCommitsFactory,
  insertCommitsFactory,
  insertStreamCommitsFactory
} from '@/modules/core/repositories/commits'
import {
  deleteProjectFactory,
  storeProjectFactory,
  storeProjectRoleFactory
} from '@/modules/core/repositories/projects'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
  getStreamFactory,
  createStreamFactory,
  updateStreamFactory,
  revokeStreamPermissionsFactory,
  grantStreamPermissionsFactory,
  getOnboardingBaseStreamFactory,
  getUserStreamsPageFactory,
  getUserStreamsCountFactory,
  getStreamRolesFactory
} from '@/modules/core/repositories/streams'
import { getUserFactory, getUsersFactory } from '@/modules/core/repositories/users'
import {
  createNewProjectFactory,
  deleteProjectAndCommitsFactory
} from '@/modules/core/services/projects'
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
  getProjectDbClient,
  getProjectReplicationDbs,
  getReplicationDbs,
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
import type { EventBusEmit } from '@/modules/shared/services/eventBus'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  filteredSubscribe,
  ProjectSubscriptions,
  UserSubscriptions
} from '@/modules/shared/utils/subscriptions'
import { has } from 'lodash-es'
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
import { StreamNotFoundError } from '@/modules/core/errors/stream'
import { asMultiregionalOperation, replicateFactory } from '@/modules/shared/command'
import type { Knex } from 'knex'
import type { Logger } from '@/observability/logging'

const getUser = getUserFactory({ db })
const getStream = getStreamFactory({ db })

const buildFinalizeProjectInvite = (mainDb: Knex, emit: EventBusEmit) =>
  finalizeResourceInviteFactory({
    findInvite: findInviteFactory({ db: mainDb }),
    validateInvite: validateProjectInviteBeforeFinalizationFactory({
      getProject: getStreamFactory({ db: mainDb })
    }),
    processInvite: processFinalizedProjectInviteFactory({
      getProject: getStreamFactory({ db: mainDb }),
      addProjectRole: addOrUpdateStreamCollaboratorFactory({
        validateStreamAccess: validateStreamAccessFactory({ authorizeResolver }),
        getUser: getUserFactory({ db: mainDb }),
        grantStreamPermissions: grantStreamPermissionsFactory({ db: mainDb }),
        getStreamRoles: getStreamRolesFactory({ db: mainDb }),
        emitEvent: emit
      })
    }),
    deleteInvitesByTarget: deleteInvitesByTargetFactory({ db: mainDb }),
    insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db: mainDb }),
    emitEvent: emit,
    findEmail: findEmailFactory({ db: mainDb }),
    validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
      createUserEmail: createUserEmailFactory({ db: mainDb }),
      ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db: mainDb }),
      findEmail: findEmailFactory({ db: mainDb }),
      updateEmailInvites: finalizeInvitedServerRegistrationFactory({
        deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db: mainDb }),
        updateAllInviteTargets: updateAllInviteTargetsFactory({ db: mainDb })
      }),
      requestNewEmailVerification: requestNewEmailVerificationFactory({
        findEmail: findEmailFactory({ db: mainDb }),
        getUser: getUserFactory({ db: mainDb }),
        getServerInfo: getServerInfoFactory({ db: mainDb }),
        deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({
          db: mainDb
        }),
        renderEmail,
        sendEmail
      })
    }),
    collectAndValidateResourceTargets: collectAndValidateCoreTargetsFactory({
      getStream: getStreamFactory({ db: mainDb })
    }),
    getUser: getUserFactory({ db: mainDb }),
    getServerInfo: getServerInfoFactory({ db: mainDb })
  })

const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })
const isStreamCollaborator = isStreamCollaboratorFactory({
  getStream
})
const removeStreamCollaborator = removeStreamCollaboratorFactory({
  validateStreamAccess,
  isStreamCollaborator,
  revokeStreamPermissions: revokeStreamPermissionsFactory({ db }),
  getStreamRoles: getStreamRolesFactory({ db }),
  emitEvent: getEventBus().emit
})
const updateStreamRoleAndNotify = updateStreamRoleAndNotifyFactory({
  isStreamCollaborator,
  addOrUpdateStreamCollaborator: addOrUpdateStreamCollaboratorFactory({
    validateStreamAccess,
    getUser,
    grantStreamPermissions: grantStreamPermissionsFactory({ db }),
    getStreamRoles: getStreamRolesFactory({ db }),
    emitEvent: getEventBus().emit
  }),
  removeStreamCollaborator
})

const getUserStreams = getUserStreamsPageFactory({ db })
const getUserStreamsCount = getUserStreamsCountFactory({ db })
const throwIfRateLimited = throwIfRateLimitedFactory({
  rateLimiterEnabled: isRateLimiterEnabled()
})

const deleteStreamAndNotify = async (
  projectId: string,
  userId: string,
  ctxLogger: Logger
) =>
  asMultiregionalOperation(
    ({ allDbs, mainDb, emit }) => {
      const deleteStreamAndNotify = deleteStreamAndNotifyFactory({
        deleteProjectAndCommits: deleteProjectAndCommitsFactory({
          deleteProject: replicateFactory(allDbs, deleteProjectFactory),
          deleteProjectCommits: replicateFactory(allDbs, deleteProjectCommitsFactory)
        }),
        emitEvent: emit,
        deleteAllResourceInvites: deleteAllResourceInvitesFactory({ db: mainDb }),
        getStream: getStreamFactory({ db: mainDb })
      })
      return deleteStreamAndNotify(projectId, userId)
    },
    {
      logger: ctxLogger,
      name: 'delete project',
      description: `Cascade deleting a project`,
      dbs: await getProjectReplicationDbs({ projectId })
    }
  )

const resolvers: Resolvers = {
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
      if (!project) {
        // This should not be happening, because canQuery should've thrown
        // And yet it does...so extra logging is necessary

        // Test canQuery again - is it a cache issue?
        context.clearCache()
        const canQueryAgain = await context.authPolicies.project.canRead({
          projectId: args.id,
          userId: context.userId
        })

        context.log.error(
          {
            projectId: args.id,
            userId: context.userId,
            project,
            canQuery,
            canQueryAgain
          },
          'Unexpected project not found'
        )
        throw new StreamNotFoundError('Project not found')
      }

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

      const results = await Promise.all(
        args.ids.map((id) => deleteStreamAndNotify(id, ctx.userId!, ctx.log))
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

      return deleteStreamAndNotify(projectId, userId!, logger)
    },
    async createForOnboarding(_parent, _args, { userId, resourceAccessRules, log }) {
      return await asMultiregionalOperation(
        async ({ mainDb, emit, allDbs }) => {
          // We want to read & write from main DB - this isn't occurring in a multi region workspace ctx
          const createOnboardingStream = createOnboardingStreamFactory({
            getOnboardingBaseProject: getOnboardingBaseProjectFactory({
              getOnboardingBaseStream: getOnboardingBaseStreamFactory({ db: mainDb })
            }),
            cloneStream: cloneStreamFactory({
              getStream: getStreamFactory({ db: mainDb }),
              getUser: getUserFactory({ db: mainDb }),
              newProjectDb: mainDb,
              sourceProjectDb: mainDb,
              createStream: replicateFactory(allDbs, createStreamFactory),
              insertCommits: insertCommitsFactory({ db: mainDb }),
              getBatchedStreamCommits: getBatchedStreamCommitsFactory({ db: mainDb }),
              insertStreamCommits: insertStreamCommitsFactory({ db: mainDb }),
              getBatchedStreamBranches: getBatchedStreamBranchesFactory({ db: mainDb }),
              insertBranches: insertBranchesFactory({ db: mainDb }),
              getBatchedBranchCommits: getBatchedBranchCommitsFactory({ db: mainDb }),
              insertBranchCommits: insertBranchCommitsFactory({ db: mainDb }),
              getBatchedStreamComments: getBatchedStreamCommentsFactory({ db: mainDb }),
              insertComments: insertCommentsFactory({ db: mainDb }),
              getCommentLinks: getCommentLinksFactory({ db: mainDb }),
              insertCommentLinks: insertCommentLinksFactory({ db: mainDb }),
              emitEvent: emit,
              storeProjectRole: storeProjectRoleFactory({ db: mainDb })
            }),
            createStreamReturnRecord: createStreamReturnRecordFactory({
              inviteUsersToProject: inviteUsersToProjectFactory({
                createAndSendInvite: createAndSendInviteFactory({
                  findUserByTarget: findUserByTargetFactory({ db: mainDb }),
                  insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({
                    db: mainDb
                  }),
                  collectAndValidateResourceTargets:
                    collectAndValidateCoreTargetsFactory({
                      getStream: getStreamFactory({ db: mainDb })
                    }),
                  buildInviteEmailContents: buildCoreInviteEmailContentsFactory({
                    getStream: getStreamFactory({ db: mainDb })
                  }),
                  emitEvent: emit,
                  getUser: getUserFactory({ db: mainDb }),
                  getServerInfo: getServerInfoFactory({ db: mainDb }),
                  finalizeInvite: buildFinalizeProjectInvite(mainDb, emit)
                }),
                getUsers: getUsersFactory({ db: mainDb })
              }),
              createStream: replicateFactory(allDbs, createStreamFactory),
              storeProjectRole: storeProjectRoleFactory({ db: mainDb }),
              emitEvent: emit
            }),
            getUser: getUserFactory({ db: mainDb }),
            updateStream: replicateFactory(allDbs, updateStreamFactory)
          })

          return await createOnboardingStream({
            targetUserId: userId!,
            targetUserResourceAccessRules: resourceAccessRules,
            logger: log
          })
        },
        {
          logger: log,
          name: 'createOnboardingProject',
          dbs: [db], // Cloning does not support multiregion
          description: `Create a project for onboarding`
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

      const res = await asMultiregionalOperation(
        async ({ mainDb, allDbs, emit }) => {
          const updateStreamAndNotify = updateStreamAndNotifyFactory({
            getStream: getStreamFactory({ db: mainDb }),
            updateStream: replicateFactory(allDbs, updateStreamFactory),
            emitEvent: emit
          })

          return await updateStreamAndNotify(update, userId!)
        },
        {
          logger,
          name: 'Update Project',
          dbs: await getProjectReplicationDbs({ projectId })
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
      const project = await asMultiregionalOperation(
        async ({ allDbs, mainDb, emit }) => {
          const createNewProject = createNewProjectFactory({
            storeProject: replicateFactory(allDbs, storeProjectFactory),
            storeProjectRole: storeProjectRoleFactory({ db: mainDb }),
            emitEvent: emit
          })

          return createNewProject({
            ...(args.input || {}),
            ownerId: context.userId!,
            regionKey
          })
        },
        {
          logger,
          name: 'projectCreate',
          dbs: await getReplicationDbs({ regionKey }),
          description: `Create a new project`
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

      return ret!
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
          cursor: null,
          numberOfHidden: 0
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
      if (has(parent, 'role')) return parent.role || null

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
}

export default resolvers
