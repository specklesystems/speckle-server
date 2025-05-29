import { db } from '@/db/knex'
import {
  Resolvers,
  TokenResourceIdentifierType
} from '@/modules/core/graph/generated/graphql'
import { removePrivateFields } from '@/modules/core/helpers/userHelper'
import {
  updateProjectFactory,
  getRolesByUserIdFactory,
  getStreamFactory,
  deleteStreamFactory,
  revokeStreamPermissionsFactory,
  grantStreamPermissionsFactory,
  legacyGetStreamsFactory,
  getStreamCollaboratorsFactory
} from '@/modules/core/repositories/streams'
import { InviteCreateValidationError } from '@/modules/serverinvites/errors'
import {
  deleteAllResourceInvitesFactory,
  deleteInviteFactory,
  deleteInvitesByTargetFactory,
  deleteServerOnlyInvitesFactory,
  findInviteFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  markInviteUpdatedFactory,
  queryAllResourceInvitesFactory,
  queryAllUserResourceInvitesFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { buildCoreInviteEmailContentsFactory } from '@/modules/serverinvites/services/coreEmailContents'
import {
  createAndSendInviteFactory,
  resendInviteEmailFactory
} from '@/modules/serverinvites/services/creation'
import {
  cancelResourceInviteFactory,
  finalizeInvitedServerRegistrationFactory,
  finalizeResourceInviteFactory
} from '@/modules/serverinvites/services/processing'
import { createProjectInviteFactory } from '@/modules/serverinvites/services/projectInviteManagement'
import { getInvitationTargetUsersFactory } from '@/modules/serverinvites/services/retrieval'
import { authorizeResolver } from '@/modules/shared'
import {
  getFeatureFlags,
  isRateLimiterEnabled
} from '@/modules/shared/helpers/envHelper'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { WorkspaceInviteResourceType } from '@/modules/workspacesCore/domain/constants'
import {
  WorkspaceInvalidRoleError,
  WorkspaceNotFoundError,
  WorkspacePaidPlanActiveError,
  WorkspacesNotAuthorizedError
} from '@/modules/workspaces/errors/workspace'
import {
  deleteWorkspaceFactory as repoDeleteWorkspaceFactory,
  deleteWorkspaceRoleFactory as repoDeleteWorkspaceRoleFactory,
  getWorkspaceCollaboratorsFactory,
  getWorkspaceFactory,
  getWorkspaceRolesFactory,
  upsertWorkspaceFactory,
  upsertWorkspaceRoleFactory,
  getWorkspaceCollaboratorsTotalCountFactory,
  deleteWorkspaceDomainFactory as repoDeleteWorkspaceDomainFactory,
  storeWorkspaceDomainFactory,
  getWorkspaceDomainsFactory,
  getUserDiscoverableWorkspacesFactory,
  getWorkspaceWithDomainsFactory,
  getWorkspaceRoleForUserFactory,
  getWorkspaceBySlugFactory,
  countDomainsByWorkspaceIdFactory,
  getWorkspaceCreationStateFactory,
  upsertWorkspaceCreationStateFactory,
  queryWorkspacesFactory,
  countWorkspacesFactory,
  countWorkspaceRoleWithOptionalProjectRoleFactory,
  getPaginatedWorkspaceProjectsFactory,
  getWorkspaceRolesForUserFactory,
  getWorkspacesFactory
} from '@/modules/workspaces/repositories/workspaces'
import {
  buildWorkspaceInviteEmailContentsFactory,
  collectAndValidateWorkspaceTargetsFactory,
  createWorkspaceInviteFactory,
  getPendingWorkspaceCollaboratorsFactory,
  getUserPendingWorkspaceInviteFactory,
  getUserPendingWorkspaceInvitesFactory,
  processFinalizedWorkspaceInviteFactory,
  validateWorkspaceInviteBeforeFinalizationFactory
} from '@/modules/workspaces/services/invites'
import {
  addDomainToWorkspaceFactory,
  createWorkspaceFactory,
  deleteWorkspaceFactory,
  deleteWorkspaceRoleFactory,
  generateValidSlugFactory,
  updateWorkspaceFactory,
  addOrUpdateWorkspaceRoleFactory,
  validateSlugFactory
} from '@/modules/workspaces/services/management'
import {
  createWorkspaceProjectFactory,
  getWorkspaceRoleToDefaultProjectRoleMappingFactory,
  getWorkspaceSeatTypeToProjectRoleMappingFactory,
  moveProjectToWorkspaceFactory,
  queryAllWorkspaceProjectsFactory,
  validateWorkspaceMemberProjectRoleFactory
} from '@/modules/workspaces/services/projects'
import {
  getDiscoverableWorkspacesForUserFactory,
  getWorkspacesForUserFactory
} from '@/modules/workspaces/services/retrieval'
import {
  Roles,
  WorkspaceRoles,
  removeNullOrUndefinedKeys,
  throwUncoveredError
} from '@speckle/shared'
import { chunk, omit } from 'lodash'
import {
  findEmailsByUserIdFactory,
  findVerifiedEmailsByUserIdFactory,
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory
} from '@/modules/core/repositories/userEmails'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import {
  deleteWorkspaceDomainFactory,
  isUserWorkspaceDomainPolicyCompliantFactory
} from '@/modules/workspaces/services/domains'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { isWorkspaceRole } from '@/modules/workspaces/domain/logic'
import {
  addOrUpdateStreamCollaboratorFactory,
  isStreamCollaboratorFactory,
  removeStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import {
  filteredSubscribe,
  WorkspaceSubscriptions
} from '@/modules/shared/utils/subscriptions'
import { updateStreamRoleAndNotifyFactory } from '@/modules/core/services/streams/management'
import { getUserFactory, getUsersFactory } from '@/modules/core/repositories/users'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { asOperation, commandFactory } from '@/modules/shared/command'
import { throwIfRateLimitedFactory } from '@/modules/core/utils/ratelimiter'
import { getRegionDb } from '@/modules/multiregion/utils/dbSelector'
import {
  listUserExpiredSsoSessionsFactory,
  listWorkspaceSsoMembershipsByUserEmailFactory
} from '@/modules/workspaces/services/sso'
import {
  deleteSsoProviderFactory,
  getUserSsoSessionFactory,
  getWorkspaceSsoProviderFactory,
  getWorkspaceSsoProviderRecordFactory,
  listUserSsoSessionsFactory,
  listWorkspaceSsoMembershipsFactory
} from '@/modules/workspaces/repositories/sso'
import { getDecryptor } from '@/modules/workspaces/helpers/sso'
import { getFunctionsFactory } from '@/modules/automate/clients/executionEngine'
import {
  ExecutionEngineFailedResponseError,
  ExecutionEngineNetworkError
} from '@/modules/automate/errors/executionEngine'
import { getDefaultRegionFactory } from '@/modules/workspaces/repositories/regions'
import { convertFunctionToGraphQLReturn } from '@/modules/automate/services/functionManagement'
import {
  getWorkspacePlanFactory,
  getWorkspaceWithPlanFactory,
  upsertWorkspacePlanFactory
} from '@/modules/gatekeeper/repositories/billing'
import { Knex } from 'knex'
import { getPaginatedItemsFactory } from '@/modules/shared/services/paginatedItems'
import { BadRequestError } from '@/modules/shared/errors'
import {
  dismissWorkspaceJoinRequestFactory,
  requestToJoinWorkspaceFactory
} from '@/modules/workspaces/services/workspaceJoinRequests'
import {
  createWorkspaceJoinRequestFactory,
  updateWorkspaceJoinRequestStatusFactory
} from '@/modules/workspaces/repositories/workspaceJoinRequests'
import { sendWorkspaceJoinRequestReceivedEmailFactory } from '@/modules/workspaces/services/workspaceJoinRequestEmails/received'
import { getProjectFactory } from '@/modules/core/repositories/projects'
import { getProjectRegionKey } from '@/modules/multiregion/utils/regionSelector'
import { scheduleJob } from '@/modules/multiregion/services/queue'
import { updateWorkspacePlanFactory } from '@/modules/gatekeeper/services/workspacePlans'
import { GetWorkspaceCollaboratorsArgs } from '@/modules/workspaces/domain/operations'
import { WorkspaceTeamMember } from '@/modules/workspaces/domain/types'
import { UsersMeta } from '@/modules/core/dbSchema'
import { setUserActiveWorkspaceFactory } from '@/modules/workspaces/repositories/users'
import { getGenericRedis } from '@/modules/shared/redis/redis'
import {
  AuthCodePayloadAction,
  createStoredAuthCodeFactory
} from '@/modules/automate/services/authCode'
import { ensureValidWorkspaceRoleSeatFactory } from '@/modules/workspaces/services/workspaceSeat'
import {
  createWorkspaceSeatFactory,
  getWorkspaceRoleAndSeatFactory,
  getWorkspaceRolesAndSeatsFactory,
  getWorkspaceUserSeatFactory
} from '@/modules/gatekeeper/repositories/workspaceSeat'
import { throwIfResourceAccessNotAllowed } from '@/modules/core/helpers/token'
import {
  mapAuthToServerError,
  throwIfAuthNotOk
} from '@/modules/shared/helpers/errorHelper'
import { withOperationLogging } from '@/observability/domain/businessLogging'
import {
  processFinalizedProjectInviteFactory,
  validateProjectInviteBeforeFinalizationFactory
} from '@/modules/serverinvites/services/coreFinalization'
import { WorkspaceInvitesLimit } from '@/modules/workspaces/domain/constants'

const eventBus = getEventBus()
const getServerInfo = getServerInfoFactory({ db })
const getUser = getUserFactory({ db })
const getUsers = getUsersFactory({ db })
const getStream = getStreamFactory({ db })
const requestNewEmailVerification = requestNewEmailVerificationFactory({
  findEmail: findEmailFactory({ db }),
  getUser,
  getServerInfo,
  deleteOldAndInsertNewVerification: deleteOldAndInsertNewVerificationFactory({ db }),
  renderEmail,
  sendEmail
})

const buildCollectAndValidateResourceTargets = () =>
  collectAndValidateWorkspaceTargetsFactory({
    getStream,
    getWorkspace: getWorkspaceFactory({ db }),
    getWorkspaceDomains: getWorkspaceDomainsFactory({ db }),
    findVerifiedEmailsByUserId: findVerifiedEmailsByUserIdFactory({ db }),
    getWorkspaceRoleAndSeat: getWorkspaceRoleAndSeatFactory({ db }),
    validateWorkspaceMemberProjectRoleFactory:
      validateWorkspaceMemberProjectRoleFactory({
        getWorkspaceRoleAndSeat: getWorkspaceRoleAndSeatFactory({ db }),
        getWorkspaceWithPlan: getWorkspaceWithPlanFactory({ db }),
        getWorkspaceRoleToDefaultProjectRoleMapping:
          getWorkspaceRoleToDefaultProjectRoleMappingFactory(),
        getWorkspaceSeatTypeToProjectRoleMapping:
          getWorkspaceSeatTypeToProjectRoleMappingFactory()
      })
  })

const buildFinalizeWorkspaceInvite = () =>
  finalizeResourceInviteFactory({
    findInvite: findInviteFactory({
      db
    }),
    deleteInvitesByTarget: deleteInvitesByTargetFactory({ db }),
    insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
    emitEvent: ({ eventName, payload }) =>
      getEventBus().emit({
        eventName,
        payload
      }),
    validateInvite: validateWorkspaceInviteBeforeFinalizationFactory({
      getWorkspace: getWorkspaceFactory({ db }),
      validateProjectInviteBeforeFinalization:
        validateProjectInviteBeforeFinalizationFactory({
          getProject: getStream
        })
    }),
    processInvite: processFinalizedWorkspaceInviteFactory({
      getWorkspace: getWorkspaceFactory({ db }),
      updateWorkspaceRole: addOrUpdateWorkspaceRoleFactory({
        getWorkspaceWithDomains: getWorkspaceWithDomainsFactory({ db }),
        findVerifiedEmailsByUserId: findVerifiedEmailsByUserIdFactory({ db }),
        getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
        upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
        emitWorkspaceEvent: getEventBus().emit,
        ensureValidWorkspaceRoleSeat: ensureValidWorkspaceRoleSeatFactory({
          createWorkspaceSeat: createWorkspaceSeatFactory({ db }),
          getWorkspaceUserSeat: getWorkspaceUserSeatFactory({ db }),
          eventEmit: getEventBus().emit
        })
      }),
      processFinalizedProjectInvite: processFinalizedProjectInviteFactory({
        getProject: getStream,
        addProjectRole: addOrUpdateStreamCollaborator
      })
    }),
    findEmail: findEmailFactory({ db }),
    validateAndCreateUserEmail: validateAndCreateUserEmailFactory({
      createUserEmail: createUserEmailFactory({ db }),
      ensureNoPrimaryEmailForUser: ensureNoPrimaryEmailForUserFactory({ db }),
      findEmail: findEmailFactory({ db }),
      updateEmailInvites: finalizeInvitedServerRegistrationFactory({
        deleteServerOnlyInvites: deleteServerOnlyInvitesFactory({ db }),
        updateAllInviteTargets: updateAllInviteTargetsFactory({ db })
      }),
      requestNewEmailVerification
    }),
    collectAndValidateResourceTargets: buildCollectAndValidateResourceTargets(),
    getUser,
    getServerInfo
  })

const validateStreamAccess = validateStreamAccessFactory({ authorizeResolver })
const addOrUpdateStreamCollaborator = addOrUpdateStreamCollaboratorFactory({
  validateStreamAccess,
  getUser,
  grantStreamPermissions: grantStreamPermissionsFactory({ db }),
  emitEvent: getEventBus().emit
})

const buildFinalizeProjectInvite = () =>
  finalizeResourceInviteFactory({
    findInvite: findInviteFactory({ db }),
    validateInvite: validateProjectInviteBeforeFinalizationFactory({
      getProject: getStream
    }),
    processInvite: processFinalizedProjectInviteFactory({
      getProject: getStream,
      addProjectRole: addOrUpdateStreamCollaborator
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
      requestNewEmailVerification
    }),
    collectAndValidateResourceTargets: buildCollectAndValidateResourceTargets(),
    getUser,
    getServerInfo
  })

const buildCreateAndSendServerOrProjectInvite = () =>
  createAndSendInviteFactory({
    findUserByTarget: findUserByTargetFactory({ db }),
    insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
    collectAndValidateResourceTargets: buildCollectAndValidateResourceTargets(),
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
  })

const buildCreateAndSendWorkspaceInvite = () =>
  createAndSendInviteFactory({
    findUserByTarget: findUserByTargetFactory({ db }),
    insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
    collectAndValidateResourceTargets: buildCollectAndValidateResourceTargets(),
    buildInviteEmailContents: buildWorkspaceInviteEmailContentsFactory({
      getStream,
      getWorkspace: getWorkspaceFactory({ db })
    }),
    emitEvent: ({ eventName, payload }) =>
      getEventBus().emit({
        eventName,
        payload
      }),
    getUser,
    getServerInfo,
    finalizeInvite: buildFinalizeWorkspaceInvite()
  })
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
  addOrUpdateStreamCollaborator,
  removeStreamCollaborator
})

const { FF_WORKSPACES_MODULE_ENABLED, FF_MOVE_PROJECT_REGION_ENABLED } =
  getFeatureFlags()
const throwIfRateLimited = throwIfRateLimitedFactory({
  rateLimiterEnabled: isRateLimiterEnabled()
})

export = FF_WORKSPACES_MODULE_ENABLED
  ? ({
      Query: {
        workspace: async (_parent, args, ctx) => {
          const workspace = await ctx.loaders.workspaces!.getWorkspace.load(args.id)
          if (!workspace) {
            throw new WorkspaceNotFoundError()
          }

          await authorizeResolver(
            ctx.userId,
            args.id,
            Roles.Workspace.Guest,
            ctx.resourceAccessRules
          )

          return workspace
        },
        workspaceBySlug: async (_parent, args, ctx) => {
          const workspace = await getWorkspaceBySlugFactory({ db })({
            workspaceSlug: args.slug
          })

          if (!workspace) {
            throw new WorkspaceNotFoundError()
          }

          await authorizeResolver(
            ctx.userId,
            workspace.id,
            Roles.Workspace.Guest,
            ctx.resourceAccessRules
          )

          return workspace
        },
        workspaceSsoByEmail: async (_parent, args) => {
          const workspaces = await listWorkspaceSsoMembershipsByUserEmailFactory({
            findEmail: findEmailFactory({ db }),
            listWorkspaceSsoMemberships: listWorkspaceSsoMembershipsFactory({ db })
          })({
            userEmail: args.email
          })
          return workspaces
        },
        workspaceInvite: async (_parent, args, ctx) => {
          const getPendingInvite = getUserPendingWorkspaceInviteFactory({
            findInvite: findInviteFactory({
              db
            }),
            getUser,
            getWorkspaceBySlug: getWorkspaceBySlugFactory({ db })
          })

          const useSlug = !!args.options?.useSlug

          return await getPendingInvite({
            userId: ctx.userId!,
            token: args.token,
            ...(useSlug
              ? { workspaceSlug: args.workspaceId }
              : { workspaceId: args.workspaceId })
          })
        },
        validateWorkspaceSlug: async (_parent, args) => {
          const validateSlug = validateSlugFactory({
            getWorkspaceBySlug: getWorkspaceBySlugFactory({ db })
          })
          await validateSlug({ slug: args.slug })
          return true
        }
      },
      Mutation: {
        workspaceMutations: () => ({}),
        admin: () => ({})
      },
      ProjectInviteMutations: {
        async createForWorkspace(_parent, args, ctx) {
          const { projectId } = args

          const inviteCount = args.inputs.length
          if (inviteCount > WorkspaceInvitesLimit && ctx.role !== Roles.Server.Admin) {
            throw new InviteCreateValidationError(
              `Maximum ${WorkspaceInvitesLimit} invites can be sent at once by non admins`
            )
          }

          throwIfResourceAccessNotAllowed({
            resourceId: projectId,
            resourceType: TokenResourceIdentifierType.Project,
            resourceAccessRules: ctx.resourceAccessRules
          })

          const logger = ctx.log.child({
            projectId,
            streamId: projectId, //legacy
            inviteCount
          })

          const canInvite = await ctx.authPolicies.project.canInvite({
            userId: ctx.userId,
            projectId
          })
          if (!canInvite.isOk) {
            throw mapAuthToServerError(canInvite.error)
          }

          const createProjectInvite = createProjectInviteFactory({
            createAndSendInvite: buildCreateAndSendServerOrProjectInvite(),
            getStream
          })

          const inputBatches = chunk(args.inputs, 10)
          for (const batch of inputBatches) {
            await Promise.all(
              batch.map((i) => {
                const workspaceRole = i.workspaceRole
                if (
                  workspaceRole &&
                  !(Object.values(Roles.Workspace) as string[]).includes(workspaceRole)
                ) {
                  throw new InviteCreateValidationError(
                    'Invalid workspace role specified: ' + workspaceRole
                  )
                }

                return withOperationLogging(
                  async () =>
                    await createProjectInvite({
                      input: {
                        ...i,
                        projectId
                      },
                      inviterId: ctx.userId!,
                      inviterResourceAccessRules: ctx.resourceAccessRules,
                      secondaryResourceRoles: workspaceRole
                        ? {
                            [WorkspaceInviteResourceType]:
                              workspaceRole as WorkspaceRoles
                          }
                        : undefined,
                      allowWorkspacedProjects: true
                    }),
                  {
                    logger,
                    operationName: 'createWorkspaceProjectInviteFromBatch',
                    operationDescription: 'Create workspace project invite from batch'
                  }
                )
              })
            )
          }
          return ctx.loaders.streams.getStream.load(projectId)
        }
      },
      AdminMutations: {
        updateWorkspacePlan: async (_parent, { input }, ctx) => {
          const { workspaceId, plan: name, status } = input
          const logger = ctx.log.child({
            workspaceId,
            workspacePlanName: name
          })

          const updateWorkspacePlan = updateWorkspacePlanFactory({
            getWorkspace: getWorkspaceFactory({ db }),
            upsertWorkspacePlan: upsertWorkspacePlanFactory({ db }),
            getWorkspacePlan: getWorkspacePlanFactory({ db }),
            emitEvent: getEventBus().emit
          })

          await withOperationLogging(
            async () => await updateWorkspacePlan({ workspaceId, name, status }),
            {
              logger,
              operationName: 'updateWorkspacePlan',
              operationDescription: 'Update workspace plan'
            }
          )
          return true
        }
      },
      WorkspaceMutations: {
        create: async (_parent, args, context) => {
          const {
            name,
            description,
            logo,
            slug,
            enableDomainDiscoverabilityForDomain
          } = args.input

          const logger = context.log

          return await asOperation(
            async ({ db, emit }) => {
              const createWorkspace = createWorkspaceFactory({
                validateSlug: validateSlugFactory({
                  getWorkspaceBySlug: getWorkspaceBySlugFactory({ db })
                }),
                generateValidSlug: generateValidSlugFactory({
                  getWorkspaceBySlug: getWorkspaceBySlugFactory({ db })
                }),
                upsertWorkspace: upsertWorkspaceFactory({ db }),
                emitWorkspaceEvent: emit,
                addOrUpdateWorkspaceRole: addOrUpdateWorkspaceRoleFactory({
                  getWorkspaceWithDomains: getWorkspaceWithDomainsFactory({ db }),
                  findVerifiedEmailsByUserId: findVerifiedEmailsByUserIdFactory({
                    db
                  }),
                  getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
                  upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
                  emitWorkspaceEvent: emit,
                  ensureValidWorkspaceRoleSeat: ensureValidWorkspaceRoleSeatFactory({
                    createWorkspaceSeat: createWorkspaceSeatFactory({ db }),
                    getWorkspaceUserSeat: getWorkspaceUserSeatFactory({ db }),
                    eventEmit: emit
                  })
                })
              })

              const updateWorkspace = updateWorkspaceFactory({
                validateSlug: validateSlugFactory({
                  getWorkspaceBySlug: getWorkspaceBySlugFactory({ db })
                }),
                getWorkspace: getWorkspaceWithDomainsFactory({ db }),
                getWorkspaceSsoProviderRecord: getWorkspaceSsoProviderFactory({
                  db,
                  decrypt: getDecryptor()
                }),
                upsertWorkspace: upsertWorkspaceFactory({ db }),
                emitWorkspaceEvent: emit
              })

              const addDomain = addDomainToWorkspaceFactory({
                getWorkspace: getWorkspaceFactory({ db }),
                findEmailsByUserId: findEmailsByUserIdFactory({ db }),
                storeWorkspaceDomain: storeWorkspaceDomainFactory({ db }),
                getDomains: getWorkspaceDomainsFactory({ db }),
                emitWorkspaceEvent: emit
              })

              let workspace = await createWorkspace({
                userId: context.userId!,
                workspaceInput: {
                  name,
                  slug,
                  description: description ?? null,
                  logo: logo ?? null
                },
                userResourceAccessLimits: context.resourceAccessRules
              })

              if (enableDomainDiscoverabilityForDomain) {
                // Add domain & enable discoverability
                await addDomain({
                  workspaceId: workspace.id,
                  userId: context.userId!,
                  domain: enableDomainDiscoverabilityForDomain
                })

                workspace = await updateWorkspace({
                  workspaceId: workspace.id,
                  workspaceInput: {
                    discoverabilityEnabled: true
                  }
                })
              }

              return workspace
            },
            {
              logger,
              name: 'createWorkspace',
              description: 'Create workspace',
              transaction: true
            }
          )
        },
        delete: async (_parent, args, context) => {
          const { workspaceId } = args

          await authorizeResolver(
            context.userId!,
            workspaceId,
            Roles.Workspace.Admin,
            context.resourceAccessRules
          )

          const logger = context.log.child({
            workspaceId
          })

          const workspacePlan = await getWorkspacePlanFactory({ db })({ workspaceId })
          if (workspacePlan) {
            switch (workspacePlan.name) {
              case 'team':
              case 'teamUnlimited':
              case 'pro':
              case 'proUnlimited':
                switch (workspacePlan.status) {
                  case 'cancelationScheduled':
                  case 'valid':
                  case 'paymentFailed':
                    throw new WorkspacePaidPlanActiveError()
                  case 'canceled':
                    break
                  default:
                    throwUncoveredError(workspacePlan)
                }
              case 'free':
              case 'unlimited':
              case 'academia':
              case 'proUnlimitedInvoiced':
              case 'teamUnlimitedInvoiced':
                break
              default:
                throwUncoveredError(workspacePlan)
            }
          }

          const deleteWorkspaceFrom = (db: Knex) =>
            deleteWorkspaceFactory({
              deleteWorkspace: repoDeleteWorkspaceFactory({ db }),
              deleteProject: deleteStreamFactory({ db }),
              deleteAllResourceInvites: deleteAllResourceInvitesFactory({ db }),
              queryAllWorkspaceProjects: queryAllWorkspaceProjectsFactory({
                getStreams: legacyGetStreamsFactory({ db })
              }),
              deleteSsoProvider: deleteSsoProviderFactory({ db }),
              emitWorkspaceEvent: getEventBus().emit
            })

          // this should be turned into a get all regions and map over the regions...
          const region = await getDefaultRegionFactory({ db })({ workspaceId })
          if (region) {
            const regionDb = await getRegionDb({ regionKey: region.key })
            await withOperationLogging(
              async () => await deleteWorkspaceFrom(regionDb)({ workspaceId }),
              {
                logger: logger.child({ regionKey: region.key }),
                operationName: 'deleteWorkspaceFromRegion',
                operationDescription: 'Delete workspace from region'
              }
            )
          }

          await withOperationLogging(
            async () => await deleteWorkspaceFrom(db)({ workspaceId }),
            {
              logger,
              operationName: 'deleteWorkspace',
              operationDescription: 'Delete workspace'
            }
          )

          return true
        },
        update: async (_parent, args, context) => {
          const { id: workspaceId, ...workspaceInput } = args.input

          await authorizeResolver(
            context.userId!,
            workspaceId,
            Roles.Workspace.Admin,
            context.resourceAccessRules
          )

          const logger = context.log.child({
            workspaceId
          })

          const updateWorkspace = updateWorkspaceFactory({
            validateSlug: validateSlugFactory({
              getWorkspaceBySlug: getWorkspaceBySlugFactory({ db })
            }),
            getWorkspace: getWorkspaceWithDomainsFactory({ db }),
            getWorkspaceSsoProviderRecord: getWorkspaceSsoProviderFactory({
              db,
              decrypt: getDecryptor()
            }),
            upsertWorkspace: upsertWorkspaceFactory({ db }),
            emitWorkspaceEvent: getEventBus().emit
          })

          const workspace = await withOperationLogging(
            async () =>
              await updateWorkspace({
                workspaceId,
                workspaceInput: omit(workspaceInput, ['defaultProjectRole'])
              }),
            {
              logger,
              operationName: 'updateWorkspace',
              operationDescription: 'Update workspace'
            }
          )

          return workspace
        },
        updateRole: async (_parent, args, context) => {
          const { userId, workspaceId, role } = args.input

          await authorizeResolver(
            context.userId,
            workspaceId,
            Roles.Workspace.Admin,
            context.resourceAccessRules
          )

          const logger = context.log.child({
            workspaceId
          })

          if (!role) {
            await asOperation(
              async ({ db, emit }) => {
                const deleteWorkspaceRole = deleteWorkspaceRoleFactory({
                  deleteWorkspaceRole: repoDeleteWorkspaceRoleFactory({ db }),
                  getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
                  emitWorkspaceEvent: emit
                })

                return await deleteWorkspaceRole({
                  workspaceId,
                  userId,
                  deletedByUserId: context.userId!
                })
              },
              {
                logger,
                name: 'deleteWorkspaceRole',
                description: 'Delete workspace role',
                transaction: true
              }
            )
          } else {
            if (!isWorkspaceRole(role)) {
              throw new WorkspaceInvalidRoleError()
            }

            await asOperation(
              async ({ db: trx, emit }) => {
                const updateWorkspaceRole = addOrUpdateWorkspaceRoleFactory({
                  upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db: trx }),
                  getWorkspaceWithDomains: getWorkspaceWithDomainsFactory({ db: trx }),
                  findVerifiedEmailsByUserId: findVerifiedEmailsByUserIdFactory({
                    db: trx
                  }),
                  getWorkspaceRoles: getWorkspaceRolesFactory({ db: trx }),
                  emitWorkspaceEvent: emit,
                  ensureValidWorkspaceRoleSeat: ensureValidWorkspaceRoleSeatFactory({
                    createWorkspaceSeat: createWorkspaceSeatFactory({ db: trx }),
                    getWorkspaceUserSeat: getWorkspaceUserSeatFactory({ db: trx }),
                    eventEmit: emit
                  })
                })

                return await updateWorkspaceRole({
                  userId,
                  workspaceId,
                  role,
                  updatedByUserId: context.userId!
                })
              },
              {
                logger,
                name: 'updateWorkspaceRole',
                description: 'Update workspace role',
                transaction: true
              }
            )
          }

          context.clearCache()

          return await getWorkspaceFactory({ db })({
            workspaceId: args.input.workspaceId,
            userId: context.userId
          })
        },
        addDomain: async (_parent, args, context) => {
          const workspaceId = args.input.workspaceId
          await authorizeResolver(
            context.userId!,
            workspaceId,
            Roles.Workspace.Admin,
            context.resourceAccessRules
          )

          const logger = context.log.child({
            workspaceId
          })

          await withOperationLogging(
            async () =>
              await addDomainToWorkspaceFactory({
                getWorkspace: getWorkspaceFactory({ db }),
                findEmailsByUserId: findEmailsByUserIdFactory({ db }),
                storeWorkspaceDomain: storeWorkspaceDomainFactory({ db }),
                getDomains: getWorkspaceDomainsFactory({ db }),
                emitWorkspaceEvent: getEventBus().emit
              })({
                workspaceId,
                userId: context.userId!,
                domain: args.input.domain
              }),
            {
              logger,
              operationName: 'addDomainToWorkspace',
              operationDescription: 'Add domain to workspace'
            }
          )

          return await getWorkspaceFactory({ db })({
            workspaceId,
            userId: context.userId
          })
        },
        async deleteDomain(_parent, args, context) {
          const workspaceId = args.input.workspaceId
          await authorizeResolver(
            context.userId!,
            args.input.workspaceId,
            Roles.Workspace.Admin,
            context.resourceAccessRules
          )

          const logger = context.log.child({
            workspaceId
          })

          const deleteWorkspaceDomain = deleteWorkspaceDomainFactory({
            deleteWorkspaceDomain: repoDeleteWorkspaceDomainFactory({ db }),
            countDomainsByWorkspaceId: countDomainsByWorkspaceIdFactory({
              db
            }),
            updateWorkspace: updateWorkspaceFactory({
              validateSlug: validateSlugFactory({
                getWorkspaceBySlug: getWorkspaceBySlugFactory({ db })
              }),
              getWorkspace: getWorkspaceWithDomainsFactory({ db }),
              getWorkspaceSsoProviderRecord: getWorkspaceSsoProviderFactory({
                db,
                decrypt: getDecryptor()
              }),
              upsertWorkspace: upsertWorkspaceFactory({ db }),
              emitWorkspaceEvent: getEventBus().emit
            })
          })

          await withOperationLogging(
            async () =>
              await deleteWorkspaceDomain({ workspaceId, domainId: args.input.id }),
            {
              logger,
              operationName: 'deleteWorkspaceDomain',
              operationDescription: 'Delete domain from workspace'
            }
          )

          return await getWorkspaceFactory({ db })({
            workspaceId,
            userId: context.userId
          })
        },
        deleteSsoProvider: async (_parent, args, context) => {
          const workspaceId = args.workspaceId
          await authorizeResolver(
            context.userId,
            workspaceId,
            Roles.Workspace.Admin,
            context.resourceAccessRules
          )

          const logger = context.log.child({
            workspaceId
          })

          await withOperationLogging(
            async () => await deleteSsoProviderFactory({ db })({ workspaceId }),
            {
              logger,
              operationName: 'deleteWorkspaceSsoProvider',
              operationDescription: 'Delete SSO provider from workspace'
            }
          )

          return true
        },
        leave: async (_parent, args, context) => {
          const workspaceId = args.id

          const logger = context.log.child({
            workspaceId
          })
          await asOperation(
            async ({ db, emit }) => {
              const deleteWorkspaceRole = deleteWorkspaceRoleFactory({
                deleteWorkspaceRole: repoDeleteWorkspaceRoleFactory({ db }),
                getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
                emitWorkspaceEvent: emit
              })

              return await deleteWorkspaceRole({
                workspaceId,
                userId: context.userId!,
                deletedByUserId: context.userId!
              })
            },
            {
              logger,
              name: 'leaveWorkspace',
              description: 'Leave workspace',
              transaction: true
            }
          )

          context.clearCache()

          return true
        },
        updateCreationState: async (_parent, args, context) => {
          const workspaceId = args.input.workspaceId
          await authorizeResolver(
            context.userId!,
            args.input.workspaceId,
            Roles.Workspace.Admin,
            context.resourceAccessRules
          )
          const logger = context.log.child({
            workspaceId
          })

          await withOperationLogging(
            async () =>
              await upsertWorkspaceCreationStateFactory({ db })({
                workspaceCreationState: args.input
              }),
            {
              logger,
              operationName: 'updateWorkspaceCreationState',
              operationDescription: 'Update workspace creation state'
            }
          )
          return true
        },
        updateEmbedOptions: async (parent, args, context) => {
          const { workspaceId, hideSpeckleBranding } = args.input

          const logger = context.log.child({ workspaceId })

          return await asOperation(
            async ({ db, emit }) => {
              const workspace = await updateWorkspaceFactory({
                validateSlug: validateSlugFactory({
                  getWorkspaceBySlug: getWorkspaceBySlugFactory({ db })
                }),
                getWorkspace: getWorkspaceWithDomainsFactory({ db }),
                getWorkspaceSsoProviderRecord: getWorkspaceSsoProviderFactory({
                  db,
                  decrypt: getDecryptor()
                }),
                upsertWorkspace: upsertWorkspaceFactory({ db }),
                emitWorkspaceEvent: emit
              })({
                workspaceId,
                workspaceInput: {
                  isEmbedSpeckleBrandingHidden: hideSpeckleBranding
                }
              })

              return {
                hideSpeckleBranding: workspace.isEmbedSpeckleBrandingHidden
              }
            },
            {
              logger,
              name: 'updateWorkspaceEmbedOptions',
              description:
                'Update workspace-level configuration for the embedded viewer',
              transaction: true
            }
          )
        },
        invites: () => ({}),
        projects: () => ({}),
        dismiss: async (_parent, args, ctx) => {
          const workspaceId = args.input.workspaceId
          const logger = ctx.log.child({
            workspaceId
          })
          const dismissWorkspaceJoinRequest = dismissWorkspaceJoinRequestFactory({
            getWorkspace: getWorkspaceFactory({ db }),
            updateWorkspaceJoinRequestStatus: updateWorkspaceJoinRequestStatusFactory({
              db
            })
          })
          return await withOperationLogging(
            async () =>
              await dismissWorkspaceJoinRequest({
                userId: ctx.userId!,
                workspaceId
              }),
            {
              logger,
              operationName: 'dismissWorkspaceJoinRequest',
              operationDescription: 'Dismiss workspace join request'
            }
          )
        },
        requestToJoin: async (_parent, args, ctx) => {
          const workspaceId = args.input.workspaceId
          const logger = ctx.log.child({
            workspaceId
          })

          const requestToJoin = commandFactory({
            db,
            operationFactory: ({ db }) => {
              const createWorkspaceJoinRequest = createWorkspaceJoinRequestFactory({
                db
              })
              const sendWorkspaceJoinRequestReceivedEmail =
                sendWorkspaceJoinRequestReceivedEmailFactory({
                  renderEmail,
                  sendEmail,
                  getServerInfo,
                  getWorkspaceCollaborators: getWorkspaceCollaboratorsFactory({
                    db
                  }),
                  getUserEmails: findEmailsByUserIdFactory({ db })
                })
              return requestToJoinWorkspaceFactory({
                createWorkspaceJoinRequest,
                sendWorkspaceJoinRequestReceivedEmail,
                getUserById: getUserFactory({ db }),
                getWorkspaceWithDomains: getWorkspaceWithDomainsFactory({ db }),
                getUserEmails: findEmailsByUserIdFactory({ db }),
                addOrUpdateWorkspaceRole: addOrUpdateWorkspaceRoleFactory({
                  getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
                  getWorkspaceWithDomains: getWorkspaceWithDomainsFactory({ db }),
                  findVerifiedEmailsByUserId: findVerifiedEmailsByUserIdFactory({ db }),
                  upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
                  emitWorkspaceEvent: getEventBus().emit,
                  ensureValidWorkspaceRoleSeat: ensureValidWorkspaceRoleSeatFactory({
                    createWorkspaceSeat: createWorkspaceSeatFactory({ db }),
                    getWorkspaceUserSeat: getWorkspaceUserSeatFactory({ db }),
                    eventEmit: getEventBus().emit
                  })
                }),
                getWorkspaceTeam: getWorkspaceCollaboratorsFactory({ db })
              })
            }
          })
          return await withOperationLogging(
            async () =>
              await requestToJoin({
                userId: ctx.userId!,
                workspaceId
              }),
            {
              logger,
              operationName: 'requestToJoinWorkspace',
              operationDescription: 'Request to join workspace'
            }
          )
        }
      },
      WorkspaceInviteMutations: {
        resend: async (_parent, args, ctx) => {
          const {
            input: { inviteId, workspaceId }
          } = args

          throwIfResourceAccessNotAllowed({
            resourceId: workspaceId,
            resourceType: TokenResourceIdentifierType.Workspace,
            resourceAccessRules: ctx.resourceAccessRules
          })

          const canInvite = await ctx.authPolicies.workspace.canInvite({
            userId: ctx.userId,
            workspaceId
          })
          if (!canInvite.isOk) {
            throw mapAuthToServerError(canInvite.error)
          }

          const logger = ctx.log.child({
            workspaceId,
            inviteId
          })

          const resendInviteEmail = resendInviteEmailFactory({
            buildInviteEmailContents: buildWorkspaceInviteEmailContentsFactory({
              getStream,
              getWorkspace: getWorkspaceFactory({ db })
            }),
            findUserByTarget: findUserByTargetFactory({ db }),
            findInvite: findInviteFactory({
              db
            }),
            markInviteUpdated: markInviteUpdatedFactory({ db }),
            getUser,
            getServerInfo
          })

          await withOperationLogging(
            async () =>
              await resendInviteEmail({
                inviteId,
                resourceFilter: {
                  resourceType: WorkspaceInviteResourceType,
                  resourceId: workspaceId
                }
              }),
            {
              logger,
              operationName: 'resendWorkspaceInvite',
              operationDescription: 'Resend workspace invite'
            }
          )

          return true
        },
        create: async (_parent, args, ctx) => {
          const { workspaceId } = args

          throwIfResourceAccessNotAllowed({
            resourceId: workspaceId,
            resourceType: TokenResourceIdentifierType.Workspace,
            resourceAccessRules: ctx.resourceAccessRules
          })

          const logger = ctx.log.child({
            workspaceId
          })

          const canInvite = await ctx.authPolicies.workspace.canInvite({
            userId: ctx.userId,
            workspaceId
          })
          if (!canInvite.isOk) {
            throw mapAuthToServerError(canInvite.error)
          }

          const createInvite = createWorkspaceInviteFactory({
            createAndSendInvite: buildCreateAndSendWorkspaceInvite()
          })
          await withOperationLogging(
            async () =>
              await createInvite({
                workspaceId,
                input: args.input,
                inviterId: ctx.userId!,
                inviterResourceAccessRules: ctx.resourceAccessRules
              }),
            {
              logger,
              operationName: 'createWorkspaceInvite',
              operationDescription: 'Create workspace invite'
            }
          )

          return ctx.loaders.workspaces!.getWorkspace.load(workspaceId)
        },
        batchCreate: async (_parent, args, ctx) => {
          const { workspaceId } = args

          const inviteCount = args.input.length
          if (inviteCount > WorkspaceInvitesLimit && ctx.role !== Roles.Server.Admin) {
            throw new InviteCreateValidationError(
              `Maximum ${WorkspaceInvitesLimit} invites can be sent at once by non admins`
            )
          }

          throwIfResourceAccessNotAllowed({
            resourceId: workspaceId,
            resourceType: TokenResourceIdentifierType.Workspace,
            resourceAccessRules: ctx.resourceAccessRules
          })

          const logger = ctx.log.child({
            workspaceId,
            inviteCount
          })

          const canInvite = await ctx.authPolicies.workspace.canInvite({
            userId: ctx.userId,
            workspaceId
          })
          if (!canInvite.isOk) {
            throw mapAuthToServerError(canInvite.error)
          }

          const createInvite = createWorkspaceInviteFactory({
            createAndSendInvite: buildCreateAndSendWorkspaceInvite()
          })

          const inputBatches = chunk(args.input, 10)
          for (const batch of inputBatches) {
            await Promise.all(
              batch.map((i) =>
                withOperationLogging(
                  async () =>
                    createInvite({
                      workspaceId,
                      input: i,
                      inviterId: ctx.userId!,
                      inviterResourceAccessRules: ctx.resourceAccessRules
                    }),
                  {
                    logger: logger.child({
                      targetUserId: i.userId,
                      targetEmail: i.email
                    }),
                    operationName: 'createWorkspaceInviteFromBatch',
                    operationDescription: 'Create workspace invite from batch'
                  }
                )
              )
            )
          }

          return ctx.loaders.workspaces!.getWorkspace.load(args.workspaceId)
        },
        use: async (_parent, args, ctx) => {
          const logger = ctx.log

          const finalizeInvite = buildFinalizeWorkspaceInvite()
          await withOperationLogging(
            async () =>
              await finalizeInvite({
                finalizerUserId: ctx.userId!,
                finalizerResourceAccessLimits: ctx.resourceAccessRules,
                token: args.input.token,
                accept: args.input.accept,
                allowAttachingNewEmail: args.input.addNewEmail ?? undefined
              }),
            {
              logger,
              operationName: 'useWorkspaceInvite',
              operationDescription: 'Use workspace invite'
            }
          )

          return true
        },
        cancel: async (_parent, args, ctx) => {
          const { workspaceId, inviteId } = args

          throwIfResourceAccessNotAllowed({
            resourceId: workspaceId,
            resourceType: TokenResourceIdentifierType.Workspace,
            resourceAccessRules: ctx.resourceAccessRules
          })

          const canInvite = await ctx.authPolicies.workspace.canInvite({
            userId: ctx.userId,
            workspaceId
          })
          if (!canInvite.isOk) {
            throw mapAuthToServerError(canInvite.error)
          }

          const logger = ctx.log.child({
            workspaceId,
            inviteId
          })

          const cancelInvite = cancelResourceInviteFactory({
            findInvite: findInviteFactory({
              db
            }),
            deleteInvite: deleteInviteFactory({ db }),
            validateResourceAccess: validateWorkspaceInviteBeforeFinalizationFactory({
              getWorkspace: getWorkspaceFactory({ db }),
              validateProjectInviteBeforeFinalization:
                validateProjectInviteBeforeFinalizationFactory({
                  getProject: getStream
                })
            }),
            emitEvent: getEventBus().emit
          })

          await withOperationLogging(
            async () =>
              await cancelInvite({
                inviteId,
                cancelerId: ctx.userId!,
                cancelerResourceAccessLimits: ctx.resourceAccessRules
              }),
            {
              logger,
              operationName: 'cancelWorkspaceInvite',
              operationDescription: 'Cancel workspace invite'
            }
          )
          return ctx.loaders.workspaces!.getWorkspace.load(workspaceId)
        }
      },
      WorkspaceProjectMutations: {
        create: async (_parent, args, context) => {
          await throwIfRateLimited({
            action: 'STREAM_CREATE',
            source: context.userId!
          })

          const logger = context.log

          const canCreate = await context.authPolicies.workspace.canCreateProject({
            userId: context.userId,
            workspaceId: args.input.workspaceId
          })
          throwIfAuthNotOk(canCreate)

          const createWorkspaceProject = createWorkspaceProjectFactory({
            getDefaultRegion: getDefaultRegionFactory({ db })
          })
          const project = await withOperationLogging(
            async () =>
              await createWorkspaceProject({
                input: args.input,
                ownerId: context.userId!
              }),
            {
              logger,
              operationName: 'createWorkspaceProject',
              operationDescription: 'Create workspace project'
            }
          )

          return project
        },
        updateRole: async (_parent, args, context) => {
          const projectId = args.input.projectId
          await authorizeResolver(
            context.userId,
            args.input.projectId,
            Roles.Stream.Owner,
            context.resourceAccessRules
          )

          const logger = context.log.child({
            projectId,
            streamId: projectId //legacy
          })
          const ret = await withOperationLogging(
            async () =>
              await updateStreamRoleAndNotify(
                args.input,
                context.userId!,
                context.resourceAccessRules
              ),
            {
              logger,
              operationName: 'updateProjectRole',
              operationDescription: 'Update workspace project role'
            }
          )

          context.clearCache()

          return ret
        },
        moveToWorkspace: async (_parent, args, context) => {
          const { projectId, workspaceId } = args

          const logger = context.log.child({
            projectId,
            streamId: projectId, //legacy
            workspaceId
          })

          const canMoveToWorkspace =
            await context.authPolicies.project.canMoveToWorkspace({
              userId: context.userId,
              projectId,
              workspaceId
            })

          if (!canMoveToWorkspace.isOk) {
            throw mapAuthToServerError(canMoveToWorkspace.error)
          }

          const moveProjectToWorkspace = commandFactory({
            db,
            eventBus,
            operationFactory: ({ db, emit }) =>
              moveProjectToWorkspaceFactory({
                getProject: getProjectFactory({ db }),
                updateProject: updateProjectFactory({ db }),
                updateProjectRole: updateStreamRoleAndNotify,
                getProjectCollaborators: getStreamCollaboratorsFactory({ db }),
                getWorkspaceRolesAndSeats: getWorkspaceRolesAndSeatsFactory({ db }),
                updateWorkspaceRole: addOrUpdateWorkspaceRoleFactory({
                  getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
                  getWorkspaceWithDomains: getWorkspaceWithDomainsFactory({ db }),
                  findVerifiedEmailsByUserId: findVerifiedEmailsByUserIdFactory({
                    db
                  }),
                  upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
                  emitWorkspaceEvent: emit,
                  ensureValidWorkspaceRoleSeat: ensureValidWorkspaceRoleSeatFactory({
                    createWorkspaceSeat: createWorkspaceSeatFactory({ db }),
                    getWorkspaceUserSeat: getWorkspaceUserSeatFactory({ db }),
                    eventEmit: emit
                  })
                }),
                createWorkspaceSeat: createWorkspaceSeatFactory({ db }),
                getWorkspaceWithPlan: getWorkspaceWithPlanFactory({ db }),
                getWorkspaceDomains: getWorkspaceDomainsFactory({ db }),
                getUserEmails: findEmailsByUserIdFactory({ db })
              })
          })

          const updatedProject = await withOperationLogging(
            async () =>
              await moveProjectToWorkspace({
                projectId,
                workspaceId,
                movedByUserId: context.userId!
              }),
            {
              logger,
              operationName: 'moveProjectToWorkspace',
              operationDescription: 'Move project to workspace'
            }
          )

          // Trigger project region change, if necessary
          if (FF_MOVE_PROJECT_REGION_ENABLED) {
            const projectRegion = await getProjectRegionKey({
              projectId: updatedProject.id
            })
            const workspaceRegion = await getDefaultRegionFactory({ db })({
              workspaceId
            })

            if (!!workspaceRegion && workspaceRegion.key !== projectRegion) {
              await scheduleJob({
                type: 'move-project-region',
                payload: {
                  projectId,
                  regionKey: workspaceRegion.key
                }
              })
            }
          }

          return updatedProject
        }
      },
      Workspace: {
        defaultProjectRole: () => Roles.Stream.Reviewer,
        creationState: async (parent) => {
          return getWorkspaceCreationStateFactory({ db })({ workspaceId: parent.id })
        },
        role: async (parent, _args, ctx) => {
          const acl = await ctx.loaders.workspaces!.getWorkspaceRole.load({
            userId: ctx.userId!,
            workspaceId: parent.id
          })
          return acl?.role || null
        },
        team: async (parent, args) => {
          const roles = args.filter?.roles?.map((r) => {
            const role = r as WorkspaceRoles
            if (!Object.values(Roles.Workspace).includes(role)) {
              throw new BadRequestError(
                `The filter role ${role} is not a valid workspace role`
              )
            }
            return role
          })
          const filter = removeNullOrUndefinedKeys({
            ...args?.filter,
            roles
          })
          const team = await getPaginatedItemsFactory({
            getItems: getWorkspaceCollaboratorsFactory({ db }),
            getTotalCount: getWorkspaceCollaboratorsTotalCountFactory({ db })
          })({
            workspaceId: parent.id,
            filter,
            limit: args.limit,
            cursor: args.cursor ?? undefined
          })
          return team
        },
        teamByRole: async (parent) => {
          const { id: workspaceId } = parent

          const countWorkspaceRole = countWorkspaceRoleWithOptionalProjectRoleFactory({
            db
          })

          return {
            admins: {
              totalCount: await countWorkspaceRole({
                workspaceId,
                workspaceRole: Roles.Workspace.Admin
              })
            },
            members: {
              totalCount: await countWorkspaceRole({
                workspaceId,
                workspaceRole: Roles.Workspace.Member
              })
            },
            guests: {
              totalCount: await countWorkspaceRole({
                workspaceId,
                workspaceRole: Roles.Workspace.Guest
              })
            }
          }
        },
        invitedTeam: async (parent, args) => {
          const getPendingTeam = getPendingWorkspaceCollaboratorsFactory({
            queryAllResourceInvites: queryAllResourceInvitesFactory({
              db
            }),
            getInvitationTargetUsers: getInvitationTargetUsersFactory({ getUsers })
          })

          return await getPendingTeam({ workspaceId: parent.id, filter: args.filter })
        },
        projects: async (parent, args, ctx) => {
          const getWorkspaceProjects = getPaginatedWorkspaceProjectsFactory({ db })
          return await getWorkspaceProjects({
            workspaceId: parent.id,
            userId: ctx.userId!,
            ...args
          })
        },
        automateFunctions: async (parent, args, context) => {
          try {
            await authorizeResolver(
              context.userId,
              parent.id,
              Roles.Workspace.Member,
              context.resourceAccessRules
            )

            const authCode = await createStoredAuthCodeFactory({
              redis: getGenericRedis()
            })({
              userId: context.userId!,
              action: AuthCodePayloadAction.ListWorkspaceFunctions
            })

            const res = await getFunctionsFactory({
              logger: context.log
            })({
              auth: authCode,
              filters: {
                query: args.filter?.search ?? undefined,
                cursor: args.cursor ?? undefined,
                limit: args.limit,
                requireRelease: args.filter?.requireRelease ?? true,
                includeFeatured: args.filter?.includeFeatured ?? true,
                includeWorkspaces: [parent.id],
                includeUsers: []
              }
            })

            if (!res) {
              return {
                cursor: null,
                totalCount: 0,
                items: []
              }
            }

            const items = res.items.map(convertFunctionToGraphQLReturn)

            return {
              items,
              cursor: res.cursor,
              totalCount: res.totalCount
            }
          } catch (e) {
            const isNotFound =
              e instanceof ExecutionEngineFailedResponseError &&
              e.response.statusMessage === 'FunctionNotFound'
            if (e instanceof ExecutionEngineNetworkError || isNotFound) {
              return {
                cursor: null,
                totalCount: 0,
                items: []
              }
            }

            throw e
          }
        },
        domains: async (parent) => {
          return await getWorkspaceDomainsFactory({ db })({ workspaceIds: [parent.id] })
        },
        sso: async (parent) => {
          return await getWorkspaceSsoProviderRecordFactory({ db })({
            workspaceId: parent.id
          })
        },
        embedOptions: async (parent) => {
          return {
            hideSpeckleBranding: parent.isEmbedSpeckleBrandingHidden
          }
        }
      },
      WorkspaceSso: {
        provider: async ({ workspaceId }) => {
          const provider = await getWorkspaceSsoProviderFactory({
            db,
            decrypt: getDecryptor()
          })({
            workspaceId
          })
          if (!provider) return null

          return {
            id: provider.id,
            name: provider.provider.providerName,
            clientId: provider.provider.clientId,
            issuerUrl: provider.provider.issuerUrl
          }
        },
        session: async (parent, _args, context) => {
          return await getUserSsoSessionFactory({ db })({
            userId: context.userId!,
            workspaceId: parent.workspaceId
          })
        }
      },
      WorkspaceCollaborator: {
        user: async (parent) => {
          return parent
        },
        role: async (parent) => {
          return parent.workspaceRole
        },
        joinDate: async (parent) => {
          return parent.workspaceRoleCreatedAt
        },
        projectRoles: async (parent) => {
          const projectRoles = await getRolesByUserIdFactory({ db })({
            userId: parent.id,
            workspaceId: parent.workspaceId
          })
          return projectRoles.map(({ role, resourceId }) => ({
            projectId: resourceId,
            role
          }))
        }
      },
      LimitedWorkspaceCollaborator: {
        user: async (parent) => {
          return parent
        }
      },
      ProjectRole: {
        project: async (parent, _args, ctx) => {
          return await ctx.loaders.streams.getStream.load(parent.projectId)
        }
      },
      PendingWorkspaceCollaborator: {
        workspaceName: async (parent, _args, ctx) => {
          const workspace = await ctx.loaders.workspaces!.getWorkspace.load(
            parent.workspaceId
          )
          return workspace!.name
        },
        workspaceSlug: async (parent, _args, ctx) => {
          const workspace = await ctx.loaders.workspaces!.getWorkspace.load(
            parent.workspaceId
          )
          return workspace!.slug
        },
        invitedBy: async (parent, _args, ctx) => {
          const { invitedById } = parent
          if (!invitedById) return null

          const user = await ctx.loaders.users.getUser.load(invitedById)
          return user ? removePrivateFields(user) : null
        },
        token: async (parent, _args, ctx) => {
          // If it was specified with the request, just return it
          if (parent.token?.length) return parent.token

          const authedUserId = ctx.userId
          const targetUserId = parent.user?.id
          const inviteId = parent.inviteId

          // Only returning it for the user that is the pending stream collaborator
          if (!authedUserId || !targetUserId || authedUserId !== targetUserId) {
            return null
          }

          const invite = await ctx.loaders.invites.getInvite.load(inviteId)
          return invite?.token || null
        },
        email: async (parent, _args, ctx) => {
          if (!parent.user) return parent.email

          // TODO: Tests to check token & email access?

          const token = parent.token
          const authedUserId = ctx.userId
          const targetUserId = parent.user?.id

          // Only returning it for the user that is the pending stream collaborator
          // OR if the token was specified
          if (
            (!authedUserId || !targetUserId || authedUserId !== targetUserId) &&
            !token
          ) {
            return null
          }

          return parent.email
        }
      },
      ProjectCollaborator: {
        workspaceRole: async (parent, _args, ctx) => {
          const project = await ctx.loaders.streams.getStream.load(parent.projectId)
          if (!project?.workspaceId) return null

          const acl = await ctx.loaders.workspaces!.getWorkspaceRole.load({
            userId: parent.user.id,
            workspaceId: project.workspaceId
          })
          return acl?.role || null
        }
      },
      User: {
        discoverableWorkspaces: async (_parent, _args, context) => {
          if (!context.userId) {
            throw new WorkspacesNotAuthorizedError()
          }

          const getDiscoverableWorkspacesForUser =
            getDiscoverableWorkspacesForUserFactory({
              findEmailsByUserId: findEmailsByUserIdFactory({ db }),
              getDiscoverableWorkspaces: getUserDiscoverableWorkspacesFactory({ db })
            })

          return await getDiscoverableWorkspacesForUser({ userId: context.userId })
        },
        expiredSsoSessions: async (_parent, _args, context) => {
          if (!context.userId) {
            throw new WorkspacesNotAuthorizedError()
          }

          const listExpiredSsoSessions = listUserExpiredSsoSessionsFactory({
            listWorkspaceSsoMemberships: listWorkspaceSsoMembershipsFactory({ db }),
            listUserSsoSessions: listUserSsoSessionsFactory({ db })
          })

          return await listExpiredSsoSessions({ userId: context.userId })
        },
        workspaces: async (_parent, args, context) => {
          if (!context.userId) {
            throw new WorkspacesNotAuthorizedError()
          }

          const getWorkspaces = getWorkspacesForUserFactory({
            getWorkspaces: getWorkspacesFactory({ db }),
            getWorkspaceRolesForUser: getWorkspaceRolesForUserFactory({ db })
          })

          const workspaces = await getWorkspaces({
            userId: context.userId,
            search: args.filter?.search ?? undefined,
            completed: args.filter?.completed ?? undefined
          })

          // TODO: Pagination
          return {
            items: workspaces,
            totalCount: workspaces.length
          }
        },
        workspaceInvites: async (parent) => {
          const getInvites = getUserPendingWorkspaceInvitesFactory({
            getUser,
            getUserResourceInvites: queryAllUserResourceInvitesFactory({
              db
            })
          })

          return await getInvites(parent.id)
        },
        async activeWorkspace(parent, _args, ctx) {
          const metaVal = await ctx.loaders.users.getUserMeta.load({
            userId: parent.id,
            key: UsersMeta.metaKey.activeWorkspace
          })

          if (!metaVal?.value) return null

          return await getWorkspaceBySlugFactory({ db })({
            workspaceSlug: metaVal.value
          })
        },
        async isProjectsActive(parent, _args, ctx) {
          const metaVal = await ctx.loaders.users.getUserMeta.load({
            userId: parent.id,
            key: UsersMeta.metaKey.isProjectsActive
          })

          return !!metaVal?.value
        }
      },
      Project: {
        workspace: async (parent, _args, context) => {
          if (!parent.workspaceId) {
            return null
          }

          const workspace = await context.loaders.workspaces!.getWorkspace.load(
            parent.workspaceId
          )
          if (!workspace) {
            throw new WorkspaceNotFoundError()
          }

          await authorizeResolver(
            context.userId,
            parent.workspaceId,
            Roles.Workspace.Guest,
            context.resourceAccessRules
          )

          return workspace
        }
      },
      AdminQueries: {
        workspaceList: async (_parent, args) => {
          return await getPaginatedItemsFactory({
            getItems: queryWorkspacesFactory({ db }),
            getTotalCount: countWorkspacesFactory({ db })
          })({
            limit: args.limit,
            cursor: args.cursor,
            filter: { search: args.query ?? undefined }
          })
        }
      },
      LimitedUser: {
        workspaceDomainPolicyCompliant: async (parent, args) => {
          const { id: userId } = parent
          const { workspaceSlug } = args
          if (!workspaceSlug) return null

          return await isUserWorkspaceDomainPolicyCompliantFactory({
            getWorkspaceBySlug: getWorkspaceBySlugFactory({ db }),
            getWorkspaceDomains: getWorkspaceDomainsFactory({ db }),
            findEmailsByUserId: findEmailsByUserIdFactory({ db })
          })({ workspaceSlug, userId })
        },
        workspaceRole: async (parent, args, context) => {
          const workspaceId = args.workspaceId
          if (!workspaceId) return null

          await authorizeResolver(
            context.userId,
            workspaceId,
            Roles.Workspace.Member,
            context.resourceAccessRules
          )

          const role = await getWorkspaceRoleForUserFactory({ db })({
            userId: parent.id,
            workspaceId
          })

          return role?.role ?? null
        }
      },
      ServerInfo: {
        workspaces: () => ({})
      },
      ServerWorkspacesInfo: {
        workspacesEnabled: () => true
      },
      LimitedWorkspace: {
        team: async (parent, args) => {
          const team = await getPaginatedItemsFactory<
            Pick<GetWorkspaceCollaboratorsArgs, 'workspaceId' | 'limit' | 'cursor'>,
            WorkspaceTeamMember
          >({
            getItems: getWorkspaceCollaboratorsFactory({ db }),
            getTotalCount: getWorkspaceCollaboratorsTotalCountFactory({ db })
          })({
            workspaceId: parent.id,
            limit: args.limit ?? 100,
            cursor: args.cursor ?? undefined
          })
          return team
        },
        adminTeam: async (parent) => {
          const team = await getWorkspaceCollaboratorsFactory({ db })({
            workspaceId: parent.id,
            limit: 100,
            filter: {
              roles: [Roles.Workspace.Admin]
            }
          })
          return team
        }
      },
      ActiveUserMutations: {
        async setActiveWorkspace(_parent, args, ctx) {
          const userId = ctx.userId
          if (!userId) return false

          await Promise.all([
            ctx.loaders.users.getUserMeta.clear({
              userId,
              key: UsersMeta.metaKey.activeWorkspace
            }),
            ctx.loaders.users.getUserMeta.clear({
              userId,
              key: UsersMeta.metaKey.isProjectsActive
            })
          ])

          await setUserActiveWorkspaceFactory({ db })({
            userId,
            workspaceSlug: args.slug ?? null,
            isProjectsActive: !!args.isProjectsActive
          })

          return true
        }
      },
      Subscription: {
        workspaceProjectsUpdated: {
          subscribe: filteredSubscribe(
            WorkspaceSubscriptions.WorkspaceProjectsUpdated,
            async (payload, vars, ctx) => {
              const { workspaceId, workspaceSlug } = vars
              if (!workspaceId && !workspaceSlug) return false

              const getWorkspaceBySlug = getWorkspaceBySlugFactory({ db })
              const requestedWorkspaceId =
                workspaceId ||
                (await getWorkspaceBySlug({ workspaceSlug: workspaceSlug! }))?.id
              if (!requestedWorkspaceId) return false

              if (payload.workspaceId !== requestedWorkspaceId) return false

              // TODO: Subs dont clear until actual response!! formatResponse/formatError, doesn't kick in
              // if this handler returns false
              const projectId = payload.workspaceProjectsUpdated.projectId
              const canGetMessage =
                await ctx.authPolicies.workspace.canReceiveProjectsUpdatedMessage({
                  userId: ctx.userId,
                  projectId,
                  workspaceId: requestedWorkspaceId
                })
              if (canGetMessage.isErr) {
                return false
              }

              return true
            }
          )
        },
        workspaceUpdated: {
          subscribe: filteredSubscribe(
            WorkspaceSubscriptions.WorkspaceUpdated,
            async (payload, vars, ctx) => {
              const { workspaceId, workspaceSlug } = vars
              if (!workspaceId && !workspaceSlug) return false

              const getWorkspaceBySlug = getWorkspaceBySlugFactory({ db })
              const requestedWorkspaceId =
                workspaceId ||
                (
                  await getWorkspaceBySlug({
                    workspaceSlug: workspaceSlug!
                  })
                )?.id
              if (!requestedWorkspaceId) return false

              if (payload.workspaceUpdated.id !== requestedWorkspaceId) return false
              await authorizeResolver(
                ctx.userId!,
                payload.workspaceUpdated.id,
                Roles.Workspace.Guest,
                ctx.resourceAccessRules
              )

              return true
            }
          )
        }
      }
    } as Resolvers)
  : {}
