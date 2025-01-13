import { db } from '@/db/knex'
import {
  Resolvers,
  WorkspacePlans,
  WorkspacePlanStatuses
} from '@/modules/core/graph/generated/graphql'
import { removePrivateFields } from '@/modules/core/helpers/userHelper'
import {
  getProjectCollaboratorsFactory,
  getProjectFactory,
  updateProjectFactory,
  upsertProjectRoleFactory,
  getRolesByUserIdFactory,
  getStreamFactory,
  deleteStreamFactory,
  revokeStreamPermissionsFactory,
  grantStreamPermissionsFactory,
  legacyGetStreamsFactory,
  getUserStreamsPageFactory,
  getUserStreamsCountFactory
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
import { getFeatureFlags, getServerOrigin } from '@/modules/shared/helpers/envHelper'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { WorkspaceInviteResourceType } from '@/modules/workspaces/domain/constants'
import {
  WorkspaceInvalidRoleError,
  WorkspaceJoinNotAllowedError,
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
  getWorkspaceRolesForUserFactory,
  upsertWorkspaceFactory,
  upsertWorkspaceRoleFactory,
  workspaceInviteValidityFilter,
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
  countWorkspacesFactory
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
  updateWorkspaceRoleFactory,
  validateSlugFactory
} from '@/modules/workspaces/services/management'
import {
  createWorkspaceProjectFactory,
  getWorkspaceProjectsFactory,
  getWorkspaceRoleToDefaultProjectRoleMappingFactory,
  moveProjectToWorkspaceFactory,
  queryAllWorkspaceProjectsFactory,
  updateWorkspaceProjectRoleFactory
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
import { chunk } from 'lodash'
import {
  findEmailsByUserIdFactory,
  findVerifiedEmailsByUserIdFactory,
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory
} from '@/modules/core/repositories/userEmails'
import { joinWorkspaceFactory } from '@/modules/workspaces/services/join'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import {
  deleteWorkspaceDomainFactory,
  isUserWorkspaceDomainPolicyCompliantFactory
} from '@/modules/workspaces/services/domains'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import {
  isWorkspaceRole,
  parseDefaultProjectRole
} from '@/modules/workspaces/domain/logic'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import {
  addOrUpdateStreamCollaboratorFactory,
  isStreamCollaboratorFactory,
  removeStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import {
  addStreamInviteAcceptedActivityFactory,
  addStreamPermissionsAddedActivityFactory,
  addStreamPermissionsRevokedActivityFactory
} from '@/modules/activitystream/services/streamActivity'
import {
  filteredSubscribe,
  publish,
  WorkspaceSubscriptions
} from '@/modules/shared/utils/subscriptions'
import { updateStreamRoleAndNotifyFactory } from '@/modules/core/services/streams/management'
import { getUserFactory, getUsersFactory } from '@/modules/core/repositories/users'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { commandFactory } from '@/modules/shared/command'
import { withTransaction } from '@/modules/shared/helpers/dbHelper'
import {
  getRateLimitResult,
  isRateLimitBreached
} from '@/modules/core/services/ratelimiter'
import { RateLimitError } from '@/modules/core/errors/ratelimit'
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
import { getWorkspaceFunctions } from '@/modules/automate/clients/executionEngine'
import {
  ExecutionEngineFailedResponseError,
  ExecutionEngineNetworkError
} from '@/modules/automate/errors/executionEngine'
import { getDefaultRegionFactory } from '@/modules/workspaces/repositories/regions'
import {
  AuthCodePayloadAction,
  createStoredAuthCodeFactory
} from '@/modules/automate/services/authCode'
import { getGenericRedis } from '@/modules/shared/redis/redis'
import { convertFunctionToGraphQLReturn } from '@/modules/automate/services/functionManagement'
import {
  getWorkspacePlanFactory,
  upsertPaidWorkspacePlanFactory,
  upsertTrialWorkspacePlanFactory,
  upsertUnpaidWorkspacePlanFactory
} from '@/modules/gatekeeper/repositories/billing'
import { Knex } from 'knex'
import { getPaginatedItemsFactory } from '@/modules/shared/services/paginatedItems'
import { InvalidWorkspacePlanStatus } from '@/modules/gatekeeper/errors/billing'
import { BadRequestError } from '@/modules/shared/errors'
import { dismissWorkspaceJoinRequestFactory } from '@/modules/workspaces/services/workspaceJoinRequests'
import { updateWorkspaceJoinRequestStatusFactory } from '@/modules/workspaces/repositories/workspaceJoinRequests'

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
    findVerifiedEmailsByUserId: findVerifiedEmailsByUserIdFactory({ db })
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
    getServerInfo
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
    getServerInfo
  })
const saveActivity = saveActivityFactory({ db })
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
const getUserStreams = getUserStreamsPageFactory({ db })
const getUserStreamsCount = getUserStreamsCountFactory({ db })

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

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
              db,
              filterQuery: workspaceInviteValidityFilter
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
          await authorizeResolver(
            ctx.userId,
            args.projectId,
            Roles.Stream.Owner,
            ctx.resourceAccessRules
          )

          const inviteCount = args.inputs.length
          if (inviteCount > 10 && ctx.role !== Roles.Server.Admin) {
            throw new InviteCreateValidationError(
              'Maximum 10 invites can be sent at once by non admins'
            )
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

                return createProjectInvite({
                  input: {
                    ...i,
                    projectId: args.projectId
                  },
                  inviterId: ctx.userId!,
                  inviterResourceAccessRules: ctx.resourceAccessRules,
                  secondaryResourceRoles: workspaceRole
                    ? {
                        [WorkspaceInviteResourceType]: workspaceRole as WorkspaceRoles
                      }
                    : undefined,
                  allowWorkspacedProjects: true
                })
              })
            )
          }
          return ctx.loaders.streams.getStream.load(args.projectId)
        }
      },
      AdminMutations: {
        updateWorkspacePlan: async (_parent, { input }) => {
          const { workspaceId, plan: name, status } = input
          const workspace = await getWorkspaceFactory({ db })({
            workspaceId
          })
          const createdAt = new Date()
          if (!workspace) throw new WorkspaceNotFoundError()
          switch (name) {
            case WorkspacePlans.Starter:
              switch (status) {
                case WorkspacePlanStatuses.Trial:
                case WorkspacePlanStatuses.Expired:
                  await upsertTrialWorkspacePlanFactory({ db })({
                    workspacePlan: { workspaceId, status, name, createdAt }
                  })
                  return true
                case WorkspacePlanStatuses.Valid:
                case WorkspacePlanStatuses.CancelationScheduled:
                case WorkspacePlanStatuses.Canceled:
                case WorkspacePlanStatuses.PaymentFailed:
                  await upsertPaidWorkspacePlanFactory({ db })({
                    workspacePlan: { workspaceId, status, name, createdAt }
                  })
                  return true
                default:
                  throwUncoveredError(status)
              }
            case WorkspacePlans.Business:
            case WorkspacePlans.Plus:
              switch (status) {
                case WorkspacePlanStatuses.Trial:
                case WorkspacePlanStatuses.Expired:
                  throw new InvalidWorkspacePlanStatus()
                case WorkspacePlanStatuses.Valid:
                case WorkspacePlanStatuses.CancelationScheduled:
                case WorkspacePlanStatuses.Canceled:
                case WorkspacePlanStatuses.PaymentFailed:
                  await upsertPaidWorkspacePlanFactory({ db })({
                    workspacePlan: { workspaceId, status, name, createdAt }
                  })
                  return true
                default:
                  throwUncoveredError(status)
              }

            case WorkspacePlans.Academia:
            case WorkspacePlans.Unlimited:
              switch (status) {
                case WorkspacePlanStatuses.Valid:
                  await upsertUnpaidWorkspacePlanFactory({ db })({
                    workspacePlan: { workspaceId, status, name, createdAt }
                  })

                  return true
                case WorkspacePlanStatuses.CancelationScheduled:
                case WorkspacePlanStatuses.Canceled:
                case WorkspacePlanStatuses.Expired:
                case WorkspacePlanStatuses.PaymentFailed:
                case WorkspacePlanStatuses.Trial:
                  throw new InvalidWorkspacePlanStatus()
                default:
                  throwUncoveredError(status)
              }
            default:
              throwUncoveredError(name)
          }
        }
      },
      WorkspaceMutations: {
        create: async (_parent, args, context) => {
          const { name, description, defaultLogoIndex, logo, slug } = args.input

          const createWorkspace = createWorkspaceFactory({
            validateSlug: validateSlugFactory({
              getWorkspaceBySlug: getWorkspaceBySlugFactory({ db })
            }),
            generateValidSlug: generateValidSlugFactory({
              getWorkspaceBySlug: getWorkspaceBySlugFactory({ db })
            }),
            upsertWorkspace: upsertWorkspaceFactory({ db }),
            upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
            emitWorkspaceEvent: getEventBus().emit
          })

          const workspace = await createWorkspace({
            userId: context.userId!,
            workspaceInput: {
              name,
              slug,
              description: description ?? null,
              logo: logo ?? null,
              defaultLogoIndex: defaultLogoIndex ?? 0
            },
            userResourceAccessLimits: context.resourceAccessRules
          })

          return workspace
        },
        delete: async (_parent, args, context) => {
          const { workspaceId } = args

          await authorizeResolver(
            context.userId!,
            workspaceId,
            Roles.Workspace.Admin,
            context.resourceAccessRules
          )

          const workspacePlan = await getWorkspacePlanFactory({ db })({ workspaceId })
          if (workspacePlan) {
            switch (workspacePlan.name) {
              case 'starter':
              case 'plus':
              case 'business':
                switch (workspacePlan.status) {
                  case 'cancelationScheduled':
                  case 'valid':
                  case 'paymentFailed':
                    throw new WorkspacePaidPlanActiveError()
                  case 'canceled':
                  case 'trial':
                  case 'expired':
                    break
                  default:
                    throwUncoveredError(workspacePlan)
                }
              case 'unlimited':
              case 'academia':
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
              deleteSsoProvider: deleteSsoProviderFactory({ db })
            })

          // this should be turned into a get all regions and map over the regions...
          const region = await getDefaultRegionFactory({ db })({ workspaceId })
          if (region) {
            const regionDb = await getRegionDb({ regionKey: region.key })
            await deleteWorkspaceFrom(regionDb)({ workspaceId })
          }

          await deleteWorkspaceFrom(db)({ workspaceId })

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

          const workspace = await updateWorkspace({
            workspaceId,
            workspaceInput: {
              ...workspaceInput,
              defaultProjectRole: parseDefaultProjectRole(args.input.defaultProjectRole)
            }
          })

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

          if (!role) {
            // this is currently not working with the command factory
            // TODO: include the onWorkspaceRoleDeletedFactory listener service
            const trx = await db.transaction()
            const deleteWorkspaceRole = deleteWorkspaceRoleFactory({
              deleteWorkspaceRole: repoDeleteWorkspaceRoleFactory({ db: trx }),
              getWorkspaceRoles: getWorkspaceRolesFactory({ db: trx }),
              emitWorkspaceEvent: getEventBus().emit
            })
            await withTransaction(deleteWorkspaceRole({ workspaceId, userId }), trx)
          } else {
            if (!isWorkspaceRole(role)) {
              throw new WorkspaceInvalidRoleError()
            }
            const updateWorkspaceRole = commandFactory({
              db,
              eventBus,
              operationFactory: ({ db, emit }) =>
                updateWorkspaceRoleFactory({
                  upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
                  getWorkspaceWithDomains: getWorkspaceWithDomainsFactory({ db }),
                  findVerifiedEmailsByUserId: findVerifiedEmailsByUserIdFactory({
                    db
                  }),
                  getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
                  emitWorkspaceEvent: emit
                })
            })
            await updateWorkspaceRole({ userId, workspaceId, role })
          }

          return await getWorkspaceFactory({ db })({
            workspaceId: args.input.workspaceId,
            userId: context.userId
          })
        },
        addDomain: async (_parent, args, context) => {
          await authorizeResolver(
            context.userId!,
            args.input.workspaceId,
            Roles.Workspace.Admin,
            context.resourceAccessRules
          )

          await addDomainToWorkspaceFactory({
            getWorkspace: getWorkspaceFactory({ db }),
            findEmailsByUserId: findEmailsByUserIdFactory({ db }),
            storeWorkspaceDomain: storeWorkspaceDomainFactory({ db }),
            getDomains: getWorkspaceDomainsFactory({ db }),
            emitWorkspaceEvent: getEventBus().emit
          })({
            workspaceId: args.input.workspaceId,
            userId: context.userId!,
            domain: args.input.domain
          })

          return await getWorkspaceFactory({ db })({
            workspaceId: args.input.workspaceId,
            userId: context.userId
          })
        },
        async deleteDomain(_parent, args, context) {
          await authorizeResolver(
            context.userId!,
            args.input.workspaceId,
            Roles.Workspace.Admin,
            context.resourceAccessRules
          )
          await deleteWorkspaceDomainFactory({
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
          })({ workspaceId: args.input.workspaceId, domainId: args.input.id })

          return await getWorkspaceFactory({ db })({
            workspaceId: args.input.workspaceId,
            userId: context.userId
          })
        },
        deleteSsoProvider: async (_parent, args, context) => {
          await authorizeResolver(
            context.userId,
            args.workspaceId,
            Roles.Workspace.Admin,
            context.resourceAccessRules
          )

          await deleteSsoProviderFactory({ db })({ workspaceId: args.workspaceId })

          return true
        },
        async join(_parent, args, context) {
          if (!context.userId) throw new WorkspaceJoinNotAllowedError()

          await joinWorkspaceFactory({
            getUserEmails: findEmailsByUserIdFactory({ db }),
            getWorkspaceWithDomains: getWorkspaceWithDomainsFactory({ db }),
            upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
            emitWorkspaceEvent: getEventBus().emit
          })({ userId: context.userId, workspaceId: args.input.workspaceId })

          return await getWorkspaceFactory({ db })({
            workspaceId: args.input.workspaceId,
            userId: context.userId
          })
        },
        leave: async (_parent, args, context) => {
          // this is currently not working with the command factory
          // TODO: include the onWorkspaceRoleDeletedFactory listener service
          const trx = await db.transaction()
          const deleteWorkspaceRole = deleteWorkspaceRoleFactory({
            deleteWorkspaceRole: repoDeleteWorkspaceRoleFactory({ db: trx }),
            getWorkspaceRoles: getWorkspaceRolesFactory({ db: trx }),
            emitWorkspaceEvent: getEventBus().emit
          })
          await withTransaction(
            deleteWorkspaceRole({ workspaceId: args.id, userId: context.userId! }),
            trx
          )
          return true
        },
        updateCreationState: async (_parent, args, context) => {
          await authorizeResolver(
            context.userId!,
            args.input.workspaceId,
            Roles.Workspace.Admin,
            context.resourceAccessRules
          )
          await upsertWorkspaceCreationStateFactory({ db })({
            workspaceCreationState: args.input
          })
          return true
        },
        invites: () => ({}),
        projects: () => ({}),
        dismiss: async (_parent, args, ctx) => {
          return await dismissWorkspaceJoinRequestFactory({
            getWorkspace: getWorkspaceFactory({ db }),
            updateWorkspaceJoinRequestStatus: updateWorkspaceJoinRequestStatusFactory({
              db
            })
          })({ userId: ctx.userId!, workspaceId: args.input.workspaceId })
        }
      },
      WorkspaceInviteMutations: {
        resend: async (_parent, args, ctx) => {
          const {
            input: { inviteId, workspaceId }
          } = args

          await authorizeResolver(
            ctx.userId!,
            workspaceId,
            Roles.Workspace.Admin,
            ctx.resourceAccessRules
          )

          const resendInviteEmail = resendInviteEmailFactory({
            buildInviteEmailContents: buildWorkspaceInviteEmailContentsFactory({
              getStream,
              getWorkspace: getWorkspaceFactory({ db })
            }),
            findUserByTarget: findUserByTargetFactory({ db }),
            findInvite: findInviteFactory({
              db,
              filterQuery: workspaceInviteValidityFilter
            }),
            markInviteUpdated: markInviteUpdatedFactory({ db }),
            getUser,
            getServerInfo
          })

          await resendInviteEmail({
            inviteId,
            resourceFilter: {
              resourceType: WorkspaceInviteResourceType,
              resourceId: workspaceId
            }
          })

          return true
        },
        create: async (_parent, args, ctx) => {
          const createInvite = createWorkspaceInviteFactory({
            createAndSendInvite: buildCreateAndSendWorkspaceInvite()
          })
          await createInvite({
            workspaceId: args.workspaceId,
            input: args.input,
            inviterId: ctx.userId!,
            inviterResourceAccessRules: ctx.resourceAccessRules
          })

          return ctx.loaders.workspaces!.getWorkspace.load(args.workspaceId)
        },
        batchCreate: async (_parent, args, ctx) => {
          const inviteCount = args.input.length
          if (inviteCount > 10 && ctx.role !== Roles.Server.Admin) {
            throw new InviteCreateValidationError(
              'Maximum 10 invites can be sent at once by non admins'
            )
          }

          const createInvite = createWorkspaceInviteFactory({
            createAndSendInvite: buildCreateAndSendWorkspaceInvite()
          })

          const inputBatches = chunk(args.input, 10)
          for (const batch of inputBatches) {
            await Promise.all(
              batch.map((i) =>
                createInvite({
                  workspaceId: args.workspaceId,
                  input: i,
                  inviterId: ctx.userId!,
                  inviterResourceAccessRules: ctx.resourceAccessRules
                })
              )
            )
          }

          return ctx.loaders.workspaces!.getWorkspace.load(args.workspaceId)
        },
        use: async (_parent, args, ctx) => {
          const finalizeInvite = finalizeResourceInviteFactory({
            findInvite: findInviteFactory({
              db,
              filterQuery: workspaceInviteValidityFilter
            }),
            deleteInvitesByTarget: deleteInvitesByTargetFactory({ db }),
            insertInviteAndDeleteOld: insertInviteAndDeleteOldFactory({ db }),
            emitEvent: ({ eventName, payload }) =>
              getEventBus().emit({
                eventName,
                payload
              }),
            validateInvite: validateWorkspaceInviteBeforeFinalizationFactory({
              getWorkspace: getWorkspaceFactory({ db })
            }),
            processInvite: processFinalizedWorkspaceInviteFactory({
              getWorkspace: getWorkspaceFactory({ db }),
              updateWorkspaceRole: updateWorkspaceRoleFactory({
                getWorkspaceWithDomains: getWorkspaceWithDomainsFactory({ db }),
                findVerifiedEmailsByUserId: findVerifiedEmailsByUserIdFactory({ db }),
                getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
                upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
                emitWorkspaceEvent: getEventBus().emit
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

          await finalizeInvite({
            finalizerUserId: ctx.userId!,
            finalizerResourceAccessLimits: ctx.resourceAccessRules,
            token: args.input.token,
            accept: args.input.accept,
            resourceType: WorkspaceInviteResourceType,
            allowAttachingNewEmail: args.input.addNewEmail ?? undefined
          })

          return true
        },
        cancel: async (_parent, args, ctx) => {
          await authorizeResolver(
            ctx.userId,
            args.workspaceId,
            Roles.Workspace.Admin,
            ctx.resourceAccessRules
          )

          const cancelInvite = cancelResourceInviteFactory({
            findInvite: findInviteFactory({
              db,
              filterQuery: workspaceInviteValidityFilter
            }),
            deleteInvite: deleteInviteFactory({ db }),
            validateResourceAccess: validateWorkspaceInviteBeforeFinalizationFactory({
              getWorkspace: getWorkspaceFactory({ db })
            }),
            emitEvent: getEventBus().emit
          })

          await cancelInvite({
            resourceId: args.workspaceId,
            inviteId: args.inviteId,
            cancelerId: ctx.userId!,
            resourceType: WorkspaceInviteResourceType,
            cancelerResourceAccessLimits: ctx.resourceAccessRules
          })
          return ctx.loaders.workspaces!.getWorkspace.load(args.workspaceId)
        }
      },
      WorkspaceProjectMutations: {
        create: async (_parent, args, context) => {
          const rateLimitResult = await getRateLimitResult(
            'STREAM_CREATE',
            context.userId!
          )
          if (isRateLimitBreached(rateLimitResult)) {
            throw new RateLimitError(rateLimitResult)
          }

          await authorizeResolver(
            context.userId!,
            args.input.workspaceId,
            Roles.Workspace.Member,
            context.resourceAccessRules
          )

          const createWorkspaceProject = createWorkspaceProjectFactory({
            getDefaultRegion: getDefaultRegionFactory({ db })
          })
          const project = await createWorkspaceProject({
            input: args.input,
            ownerId: context.userId!
          })

          return project
        },
        updateRole: async (_parent, args, context) => {
          const updateWorkspaceProjectRole = updateWorkspaceProjectRoleFactory({
            getStream,
            updateStreamRoleAndNotify,
            getWorkspaceRoleForUser: getWorkspaceRoleForUserFactory({ db })
          })

          return await updateWorkspaceProjectRole({
            role: args.input,
            updater: {
              userId: context.userId!,
              resourceAccessRules: context.resourceAccessRules
            }
          })
        },
        moveToWorkspace: async (_parent, args, context) => {
          const { projectId, workspaceId } = args

          await authorizeResolver(
            context.userId,
            projectId,
            Roles.Stream.Owner,
            context.resourceAccessRules
          )
          await authorizeResolver(
            context.userId,
            workspaceId,
            Roles.Workspace.Admin,
            context.resourceAccessRules
          )

          const moveProjectToWorkspace = commandFactory({
            db,
            eventBus,
            operationFactory: ({ db, emit }) =>
              moveProjectToWorkspaceFactory({
                getProject: getProjectFactory({ db }),
                updateProject: updateProjectFactory({ db }),
                upsertProjectRole: upsertProjectRoleFactory({ db }),
                getProjectCollaborators: getProjectCollaboratorsFactory({ db }),
                getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
                getWorkspaceRoleToDefaultProjectRoleMapping:
                  getWorkspaceRoleToDefaultProjectRoleMappingFactory({
                    getWorkspace: getWorkspaceFactory({ db })
                  }),
                updateWorkspaceRole: updateWorkspaceRoleFactory({
                  getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
                  getWorkspaceWithDomains: getWorkspaceWithDomainsFactory({ db }),
                  findVerifiedEmailsByUserId: findVerifiedEmailsByUserIdFactory({
                    db
                  }),
                  upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
                  emitWorkspaceEvent: emit
                })
              })
          })

          return await moveProjectToWorkspace({ projectId, workspaceId })
        }
      },
      Workspace: {
        creationState: async (parent) => {
          return getWorkspaceCreationStateFactory({ db })({ workspaceId: parent.id })
        },
        role: async (parent, _args, ctx) => {
          const workspace = await ctx.loaders.workspaces!.getWorkspace.load(parent.id)
          return workspace?.role || null
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
        invitedTeam: async (parent, args) => {
          const getPendingTeam = getPendingWorkspaceCollaboratorsFactory({
            queryAllResourceInvites: queryAllResourceInvitesFactory({
              db,
              filterQuery: workspaceInviteValidityFilter
            }),
            getInvitationTargetUsers: getInvitationTargetUsersFactory({ getUsers })
          })

          return await getPendingTeam({ workspaceId: parent.id, filter: args.filter })
        },
        projects: async (parent, args, ctx) => {
          if (!ctx.userId) return []
          const getWorkspaceProjects = getWorkspaceProjectsFactory({
            getStreams: getUserStreams
          })
          const filter = {
            ...(args.filter || {}),
            userId: ctx.userId,
            workspaceId: parent.id
          }
          const { items, cursor } = await getWorkspaceProjects(
            {
              workspaceId: parent.id
            },
            {
              limit: args.limit || 25,
              cursor: args.cursor || null,
              filter
            }
          )
          return {
            items,
            cursor,
            totalCount: await getUserStreamsCount({
              ...filter,
              searchQuery: filter.search || undefined
            })
          }
        },
        automateFunctions: async (parent, args, context) => {
          try {
            const authCode = await createStoredAuthCodeFactory({
              redis: getGenericRedis()
            })({
              userId: context.userId!,
              action: AuthCodePayloadAction.ListWorkspaceFunctions
            })

            const res = await getWorkspaceFunctions({
              workspaceId: parent.id,
              query: removeNullOrUndefinedKeys(args),
              body: {
                speckleServerAuthenticationPayload: {
                  ...authCode,
                  origin: getServerOrigin()
                }
              }
            })

            const items = res.functions.map(convertFunctionToGraphQLReturn)

            return {
              cursor: undefined,
              totalCount: res.functions.length,
              items
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
        workspaces: async (_parent, _args, context) => {
          if (!context.userId) {
            throw new WorkspacesNotAuthorizedError()
          }

          const getWorkspaces = getWorkspacesForUserFactory({
            getWorkspace: getWorkspaceFactory({ db }),
            getWorkspaceRolesForUser: getWorkspaceRolesForUserFactory({ db })
          })

          const workspaces = await getWorkspaces({
            userId: context.userId
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
              db,
              filterQuery: workspaceInviteValidityFilter
            })
          })

          return await getInvites(parent.id)
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
          const workspaceId = args.workspaceId
          if (!workspaceId) return null

          const userId = parent.id

          return await isUserWorkspaceDomainPolicyCompliantFactory({
            findEmailsByUserId: findEmailsByUserIdFactory({ db }),
            getWorkspaceWithDomains: getWorkspaceWithDomainsFactory({ db })
          })({ workspaceId, userId })
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

          const userId = parent.id

          return await getWorkspaceRoleForUserFactory({ db })({
            userId,
            workspaceId
          })
        }
      },
      ServerInfo: {
        workspaces: () => ({})
      },
      ServerWorkspacesInfo: {
        workspacesEnabled: () => true
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
              await authorizeResolver(
                ctx.userId!,
                payload.workspaceId,
                Roles.Workspace.Guest,
                ctx.resourceAccessRules
              )

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
