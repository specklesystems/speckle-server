import { db } from '@/db/knex'
import {
  createUserEmailFactory,
  ensureNoPrimaryEmailForUserFactory,
  findEmailFactory,
  findEmailsByUserIdFactory,
  findVerifiedEmailsByUserIdFactory
} from '@/modules/core/repositories/userEmails'
import {
  deleteInvitesByTargetFactory,
  deleteServerOnlyInvitesFactory,
  findInviteFactory,
  findUserByTargetFactory,
  insertInviteAndDeleteOldFactory,
  updateAllInviteTargetsFactory
} from '@/modules/serverinvites/repositories/serverInvites'
import { createAndSendInviteFactory } from '@/modules/serverinvites/services/creation'
import { getEventBus } from '@/modules/shared/services/eventBus'
import {
  getWorkspaceRolesFactory,
  upsertWorkspaceFactory,
  upsertWorkspaceRoleFactory,
  deleteWorkspaceRoleFactory as dbDeleteWorkspaceRoleFactory,
  getWorkspaceFactory,
  getWorkspaceWithDomainsFactory,
  getWorkspaceDomainsFactory,
  storeWorkspaceDomainFactory,
  getWorkspaceBySlugFactory,
  getWorkspaceRoleForUserFactory,
  upsertWorkspaceCreationStateFactory
} from '@/modules/workspaces/repositories/workspaces'
import {
  buildWorkspaceInviteEmailContentsFactory,
  collectAndValidateWorkspaceTargetsFactory,
  createWorkspaceInviteFactory,
  processFinalizedWorkspaceInviteFactory,
  validateWorkspaceInviteBeforeFinalizationFactory
} from '@/modules/workspaces/services/invites'
import {
  createWorkspaceFactory,
  addOrUpdateWorkspaceRoleFactory,
  deleteWorkspaceRoleFactory,
  updateWorkspaceFactory,
  addDomainToWorkspaceFactory,
  validateSlugFactory,
  generateValidSlugFactory
} from '@/modules/workspaces/services/management'
import type { BasicTestUser } from '@/test/authHelper'
import type { CreateWorkspaceInviteMutationVariables } from '@/modules/core/graph/generated/graphql'
import cryptoRandomString from 'crypto-random-string'
import type {
  MaybeNullOrUndefined,
  WorkspacePlan,
  WorkspacePlans,
  WorkspaceRoles
} from '@speckle/shared'
import { PaidWorkspacePlans, Roles, WorkspacePlanStatuses } from '@speckle/shared'
import {
  getStreamFactory,
  getStreamRolesFactory,
  grantStreamPermissionsFactory
} from '@/modules/core/repositories/streams'
import { getUserFactory } from '@/modules/core/repositories/users'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import {
  associateSsoProviderWithWorkspaceFactory,
  getWorkspaceSsoProviderRecordFactory,
  storeSsoProviderRecordFactory,
  upsertUserSsoSessionFactory
} from '@/modules/workspaces/repositories/sso'
import { getEncryptor } from '@/modules/workspaces/helpers/sso'
import type { OidcProvider } from '@/modules/workspaces/domain/sso/types'
import { getFeatureFlags, getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import { getDefaultSsoSessionExpirationDate } from '@/modules/workspaces/domain/sso/logic'
import {
  getWorkspacePlanFactory,
  getWorkspaceWithPlanFactory,
  upsertWorkspacePlanFactory,
  upsertWorkspaceSubscriptionFactory
} from '@/modules/gatekeeper/repositories/billing'
import type { SetOptional } from 'type-fest'
import { isMultiRegionTestMode } from '@/test/speckle-helpers/regions'
import {
  assignWorkspaceRegionFactory,
  getAvailableRegionsFactory
} from '@/modules/workspaces/services/regions'
import { getRegionsFactory } from '@/modules/multiregion/repositories'
import { canWorkspaceUseRegionsFactory } from '@/modules/gatekeeper/services/featureAuthorization'
import {
  getDefaultRegionFactory,
  upsertRegionAssignmentFactory
} from '@/modules/workspaces/repositories/regions'
import { WorkspaceSeatType } from '@/modules/gatekeeper/domain/billing'
import {
  assignWorkspaceSeatFactory,
  ensureValidWorkspaceRoleSeatFactory,
  getWorkspaceDefaultSeatTypeFactory
} from '@/modules/workspaces/services/workspaceSeat'
import {
  createWorkspaceSeatFactory,
  getWorkspaceRoleAndSeatFactory,
  getWorkspaceUserSeatFactory
} from '@/modules/gatekeeper/repositories/workspaceSeat'
import dayjs from 'dayjs'
import {
  getWorkspaceRoleToDefaultProjectRoleMappingFactory,
  getWorkspaceSeatTypeToProjectRoleMappingFactory,
  validateWorkspaceMemberProjectRoleFactory
} from '@/modules/workspaces/services/projects'
import { assign, isBoolean, isString } from 'lodash-es'
import { captureCreatedInvite } from '@/test/speckle-helpers/inviteHelper'
import {
  finalizeInvitedServerRegistrationFactory,
  finalizeResourceInviteFactory
} from '@/modules/serverinvites/services/processing'
import { validateAndCreateUserEmailFactory } from '@/modules/core/services/userEmails'
import { requestNewEmailVerificationFactory } from '@/modules/emails/services/verification/request'
import { deleteOldAndInsertNewVerificationFactory } from '@/modules/emails/repositories'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import {
  processFinalizedProjectInviteFactory,
  validateProjectInviteBeforeFinalizationFactory
} from '@/modules/serverinvites/services/coreFinalization'
import {
  addOrUpdateStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import { authorizeResolver } from '@/modules/shared'
import type { WorkspaceCreationState } from '@/modules/workspaces/domain/types'
import type {
  Workspace,
  WorkspaceSeat,
  WorkspaceWithOptionalRole
} from '@/modules/workspacesCore/domain/types'
import { WorkspaceRole } from '@/modules/core/graph/generated/graphql'
import { asMultiregionalOperation, replicateFactory } from '@/modules/shared/command'
import { logger } from '@/observability/logging'
import type { UpdateWorkspace } from '@/modules/workspaces/domain/operations'
import { getAllRegisteredTestDbs } from '@/modules/multiregion/tests/helpers'

const { FF_WORKSPACES_MODULE_ENABLED } = getFeatureFlags()

export type BasicTestWorkspace = {
  /**
   * Leave empty, will be filled on creation
   * Note: Will be set to undefined if tests running with workspaces disabled entirely cause workspaces can't be created!
   */
  id: string
  /**
   * Leave empty, will be filled on creation
   */
  ownerId: string
  /**
   * You can leave empty, will be filled on creation
   */
  slug: string
  name: string
  description?: string
  logo?: string
  discoverabilityEnabled?: boolean
  discoverabilityAutoJoinEnabled?: boolean
  domainBasedMembershipProtectionEnabled?: boolean
}

export const createTestWorkspace = async (
  workspace: SetOptional<BasicTestWorkspace, 'id' | 'slug'>,
  owner: BasicTestUser,
  options?: {
    domain?: string
    addPlan?: Partial<Pick<WorkspacePlan, 'name' | 'status'>> | boolean | WorkspacePlans
    addSubscription?: boolean
    regionKey?: string
    addCreationState?: Pick<WorkspaceCreationState, 'completed' | 'state'>
  }
): Promise<BasicTestWorkspace> => {
  const {
    domain,
    addPlan = true,
    regionKey,
    addSubscription,
    addCreationState
  } = options || {}
  const useRegion = isMultiRegionTestMode() && regionKey

  if (!FF_WORKSPACES_MODULE_ENABLED) {
    // Just skip creation and set id to undefined - this allows this to be invoked the same way if FFs are on or off
    // When BasicTestStream.workspaceId is set to this workspaces id, it will end up just being undefined, making the stream
    // be created as if it was not assigned to a workspace, allowing tests to still work
    // (Surely if you explicitly invoke createTestWorkspace with FFs off, you know what you're doing)
    workspace.id = undefined as unknown as string
    workspace.slug = undefined as unknown as string
    return workspace as BasicTestWorkspace
  }

  const upsertWorkspacePlan = upsertWorkspacePlanFactory({ db })
  const createWorkspace: ReturnType<typeof createWorkspaceFactory> = async (...args) =>
    asMultiregionalOperation(
      async ({ allDbs, mainDb, emit }) => {
        const createWorkspace = createWorkspaceFactory({
          validateSlug: validateSlugFactory({
            getWorkspaceBySlug: getWorkspaceBySlugFactory({ db: mainDb })
          }),
          generateValidSlug: generateValidSlugFactory({
            getWorkspaceBySlug: getWorkspaceBySlugFactory({ db: mainDb })
          }),
          upsertWorkspace: replicateFactory(allDbs, upsertWorkspaceFactory),
          emitWorkspaceEvent: emit,
          addOrUpdateWorkspaceRole: addOrUpdateWorkspaceRoleFactory({
            getWorkspaceWithDomains: getWorkspaceWithDomainsFactory({ db: mainDb }),
            findVerifiedEmailsByUserId: findVerifiedEmailsByUserIdFactory({
              db: mainDb
            }),
            getWorkspaceRoles: getWorkspaceRolesFactory({ db: mainDb }),
            upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db: mainDb }),
            emitWorkspaceEvent: emit,
            ensureValidWorkspaceRoleSeat: ensureValidWorkspaceRoleSeatFactory({
              createWorkspaceSeat: createWorkspaceSeatFactory({ db: mainDb }),
              getWorkspaceUserSeat: getWorkspaceUserSeatFactory({ db: mainDb }),
              getWorkspaceDefaultSeatType: getWorkspaceDefaultSeatTypeFactory({
                getWorkspace: getWorkspaceFactory({ db: mainDb })
              }),
              eventEmit: emit
            }),
            assignWorkspaceSeat: assignWorkspaceSeatFactory({
              createWorkspaceSeat: createWorkspaceSeatFactory({ db: mainDb }),
              getWorkspaceRoleForUser: getWorkspaceRoleForUserFactory({
                db: mainDb
              }),
              eventEmit: emit,
              getWorkspaceUserSeat: getWorkspaceUserSeatFactory({ db: mainDb })
            })
          })
        })

        return createWorkspace(...args)
      },
      {
        logger,
        name: 'create workspace spec',
        dbs: await getAllRegisteredTestDbs()
      }
    )

  const upsertSubscription = upsertWorkspaceSubscriptionFactory({ db })

  const newWorkspace = await createWorkspace({
    userId: owner.id,
    workspaceInput: {
      name: workspace.name,
      slug: workspace.slug || cryptoRandomString({ length: 10 }),
      description: workspace.description || null,
      logo: workspace.logo || null
    },
    userResourceAccessLimits: null
  })

  workspace.slug = newWorkspace.slug
  workspace.id = newWorkspace.id
  workspace.ownerId = owner.id

  if (domain) {
    await addDomainToWorkspaceFactory({
      findEmailsByUserId: findEmailsByUserIdFactory({ db }),
      storeWorkspaceDomain: storeWorkspaceDomainFactory({ db }),
      getWorkspace: getWorkspaceFactory({ db }),
      emitWorkspaceEvent: getEventBus().emit,
      getDomains: getWorkspaceDomainsFactory({ db })
    })({
      userId: owner.id,
      workspaceId: workspace.id,
      domain
    })
  }

  if (addPlan || useRegion) {
    let planName: WorkspacePlans
    let planStatus: WorkspacePlanStatuses
    if (isBoolean(addPlan)) {
      planName = PaidWorkspacePlans.Team
      planStatus = WorkspacePlanStatuses.Valid
    } else {
      planName = (isString(addPlan) ? addPlan : addPlan.name) || PaidWorkspacePlans.Team
      planStatus =
        (isString(addPlan) ? WorkspacePlanStatuses.Valid : addPlan.status) ||
        WorkspacePlanStatuses.Valid
    }

    await upsertWorkspacePlan({
      workspacePlan: {
        createdAt: new Date(),
        workspaceId: newWorkspace.id,
        name: planName,
        status: planStatus
      } as WorkspacePlan
    })
  }

  if (addSubscription) {
    const aMonthFromNow = new Date()
    aMonthFromNow.setMonth(new Date().getMonth() + 1)
    await upsertSubscription({
      workspaceSubscription: {
        workspaceId: newWorkspace.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        currentBillingCycleEnd: dayjs().add(1, 'month').toDate(),
        billingInterval: 'monthly',
        currency: 'usd',
        updateIntent: null,
        subscriptionData: {
          subscriptionId: cryptoRandomString({ length: 10 }),
          customerId: cryptoRandomString({ length: 10 }),
          cancelAt: null,
          status: 'active',
          products: [],
          currentPeriodEnd: aMonthFromNow
        }
      }
    })
  }

  if (useRegion) {
    const assignRegion = assignWorkspaceRegionFactory({
      getAvailableRegions: getAvailableRegionsFactory({
        getRegions: getRegionsFactory({ db }),
        canWorkspaceUseRegions: canWorkspaceUseRegionsFactory({
          getWorkspacePlan: getWorkspacePlanFactory({ db })
        })
      }),
      upsertRegionAssignment: upsertRegionAssignmentFactory({ db }),
      getDefaultRegion: getDefaultRegionFactory({ db }),
      getWorkspace: getWorkspaceFactory({ db })
    })
    await assignRegion({
      workspaceId: newWorkspace.id,
      regionKey
    })
  }

  if (addCreationState) {
    const upsertWorkspaceState = upsertWorkspaceCreationStateFactory({ db })
    await upsertWorkspaceState({
      workspaceCreationState: {
        workspaceId: newWorkspace.id,
        state: addCreationState.state,
        completed: addCreationState.completed
      }
    })
  }

  const updateWorkspace: UpdateWorkspace = async (...args) =>
    asMultiregionalOperation(
      ({ allDbs, mainDb, emit }) => {
        const updateWorkspace = updateWorkspaceFactory({
          validateSlug: validateSlugFactory({
            getWorkspaceBySlug: getWorkspaceBySlugFactory({ db: mainDb })
          }),
          getWorkspace: getWorkspaceWithDomainsFactory({ db: mainDb }),
          getWorkspaceSsoProviderRecord: getWorkspaceSsoProviderRecordFactory({
            db: mainDb
          }),
          upsertWorkspace: replicateFactory(allDbs, upsertWorkspaceFactory),
          emitWorkspaceEvent: emit
        })

        return updateWorkspace(...args)
      },
      {
        logger,
        name: 'updateWorkspace spec',
        dbs: await getAllRegisteredTestDbs()
      }
    )

  if (workspace.discoverabilityEnabled || workspace.discoverabilityAutoJoinEnabled) {
    if (!domain) throw new Error('Domain is needed for discoverability')

    await updateWorkspace({
      workspaceId: newWorkspace.id,
      workspaceInput: {
        discoverabilityEnabled: workspace.discoverabilityEnabled,
        discoverabilityAutoJoinEnabled: workspace.discoverabilityAutoJoinEnabled
      }
    })
  }

  if (workspace.domainBasedMembershipProtectionEnabled) {
    if (!domain) throw new Error('Domain is needed for membership protection')
    await updateWorkspace({
      workspaceId: newWorkspace.id,
      workspaceInput: { domainBasedMembershipProtectionEnabled: true }
    })
  }

  return {
    ...workspace,
    ...newWorkspace,
    description: workspace.description || undefined,
    logo: workspace.logo || undefined,
    ownerId: owner.id
  }
}

export const buildBasicTestWorkspace = (
  overrides?: Partial<BasicTestWorkspace>
): BasicTestWorkspace =>
  assign(
    {
      id: cryptoRandomString({ length: 10 }),
      name: cryptoRandomString({ length: 10 }),
      slug: cryptoRandomString({ length: 10 }),
      ownerId: ''
    },
    overrides
  )

export const buildTestWorkspace = (overrides?: Partial<Workspace>): Workspace =>
  assign(
    {
      id: cryptoRandomString({ length: 10 }),
      name: cryptoRandomString({ length: 10 }),
      slug: cryptoRandomString({ length: 10 }),
      description: cryptoRandomString({ length: 10 }),
      createdAt: new Date(),
      updatedAt: new Date(),
      logo: null,
      domainBasedMembershipProtectionEnabled: false,
      discoverabilityEnabled: false,
      discoverabilityAutoJoinEnabled: false,
      defaultSeatType: null,
      isEmbedSpeckleBrandingHidden: false,
      isExclusive: false
    },
    overrides
  )

export const buildTestWorkspaceSeat = (
  overrides?: Partial<WorkspaceSeat>
): WorkspaceSeat =>
  assign(
    {
      workspaceId: cryptoRandomString({ length: 10 }),
      userId: cryptoRandomString({ length: 10 }),
      type: WorkspaceSeatType.Viewer,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    overrides
  )

export const buildTestWorkspaceWithOptionalRole = (
  overrides?: Partial<WorkspaceWithOptionalRole>
): WorkspaceWithOptionalRole =>
  assign(
    {
      id: cryptoRandomString({ length: 10 }),
      name: cryptoRandomString({ length: 10 }),
      slug: cryptoRandomString({ length: 10 }),
      description: cryptoRandomString({ length: 10 }),
      createdAt: new Date(),
      updatedAt: new Date(),
      logo: cryptoRandomString({ length: 10 }),
      domainBasedMembershipProtectionEnabled: false,
      discoverabilityEnabled: true,
      discoverabilityAutoJoinEnabled: true,
      isEmbedSpeckleBrandingHidden: true,
      role: WorkspaceRole.Member
    },
    overrides
  )

export const assignToWorkspace = async (
  workspace: BasicTestWorkspace,
  user: BasicTestUser,
  role?: WorkspaceRoles,
  seatType?: WorkspaceSeatType
) => {
  const getWorkspaceUserSeat = getWorkspaceUserSeatFactory({ db })

  const updateWorkspaceRole = addOrUpdateWorkspaceRoleFactory({
    getWorkspaceWithDomains: getWorkspaceWithDomainsFactory({ db }),
    findVerifiedEmailsByUserId: findVerifiedEmailsByUserIdFactory({ db }),
    getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
    upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
    emitWorkspaceEvent: (...args) => getEventBus().emit(...args),
    ensureValidWorkspaceRoleSeat: ensureValidWorkspaceRoleSeatFactory({
      createWorkspaceSeat: createWorkspaceSeatFactory({ db }),
      getWorkspaceUserSeat,
      getWorkspaceDefaultSeatType: getWorkspaceDefaultSeatTypeFactory({
        getWorkspace: getWorkspaceFactory({ db })
      }),
      eventEmit: getEventBus().emit
    }),
    assignWorkspaceSeat: assignWorkspaceSeatFactory({
      createWorkspaceSeat: createWorkspaceSeatFactory({ db }),
      getWorkspaceRoleForUser: getWorkspaceRoleForUserFactory({
        db
      }),
      eventEmit: getEventBus().emit,
      getWorkspaceUserSeat: getWorkspaceUserSeatFactory({ db })
    })
  })
  const assignWorkspaceSeat = assignWorkspaceSeatFactory({
    createWorkspaceSeat: createWorkspaceSeatFactory({ db }),
    getWorkspaceRoleForUser: getWorkspaceRoleForUserFactory({ db }),
    getWorkspaceUserSeat: getWorkspaceUserSeatFactory({ db }),
    eventEmit: getEventBus().emit
  })

  role = role || Roles.Workspace.Member

  await updateWorkspaceRole({
    userId: user.id,
    workspaceId: workspace.id,
    role,
    updatedByUserId: workspace.ownerId
  })

  if (seatType) {
    await assignWorkspaceSeat({
      userId: user.id,
      workspaceId: workspace.id,
      type: seatType,
      assignedByUserId: workspace.ownerId
    })
  }
}

export const unassignFromWorkspace = async (
  workspace: BasicTestWorkspace,
  user: BasicTestUser
) => {
  if (!FF_WORKSPACES_MODULE_ENABLED) {
    return // Just skip
  }

  const deleteWorkspaceRole = deleteWorkspaceRoleFactory({
    getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
    deleteWorkspaceRole: dbDeleteWorkspaceRoleFactory({ db }),
    emitWorkspaceEvent: (...args) => getEventBus().emit(...args)
  })

  await deleteWorkspaceRole({
    userId: user.id,
    workspaceId: workspace.id,
    deletedByUserId: workspace.ownerId
  })
}

export const unassignFromWorkspaces = async (
  pairs: [BasicTestWorkspace, BasicTestUser][]
) => {
  await Promise.all(pairs.map((p) => unassignFromWorkspace(p[0], p[1])))
}

export const assignToWorkspaces = async (
  pairs: [
    BasicTestWorkspace,
    BasicTestUser,
    MaybeNullOrUndefined<WorkspaceRoles>,
    seatType?: MaybeNullOrUndefined<WorkspaceSeatType>
  ][]
) => {
  // Serial execution is somehow faster with bigger batch sizes, assignToWorkspace
  // may be quite heavy on the DB
  for (const [workspace, user, role, seatType] of pairs) {
    await assignToWorkspace(workspace, user, role || undefined, seatType || undefined)
  }
}

export const createTestWorkspaces = async (
  pairs: Parameters<typeof createTestWorkspace>[]
) => {
  await Promise.all(pairs.map((p) => createTestWorkspace(...p)))
}

export const createWorkspaceInviteDirectly = async (
  args: CreateWorkspaceInviteMutationVariables,
  inviterId: string
) => {
  const getServerInfo = getServerInfoFactory({ db })
  const getStream = getStreamFactory({ db })
  const getUser = getUserFactory({ db })

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
            getWorkspaceDefaultSeatType: getWorkspaceDefaultSeatTypeFactory({
              getWorkspace: getWorkspaceFactory({ db })
            }),
            eventEmit: getEventBus().emit
          }),
          assignWorkspaceSeat: assignWorkspaceSeatFactory({
            createWorkspaceSeat: createWorkspaceSeatFactory({ db }),
            getWorkspaceRoleForUser: getWorkspaceRoleForUserFactory({
              db
            }),
            eventEmit: getEventBus().emit,
            getWorkspaceUserSeat: getWorkspaceUserSeatFactory({ db })
          })
        }),
        processFinalizedProjectInvite: processFinalizedProjectInviteFactory({
          getProject: getStream,
          addProjectRole: addOrUpdateStreamCollaboratorFactory({
            validateStreamAccess: validateStreamAccessFactory({ authorizeResolver }),
            getUser: getUserFactory({ db }),
            grantStreamPermissions: grantStreamPermissionsFactory({ db }),
            getStreamRoles: getStreamRolesFactory({ db }),
            emitEvent: getEventBus().emit
          })
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
      collectAndValidateResourceTargets: buildCollectAndValidateResourceTargets(),
      getUser,
      getServerInfo
    })

  const createAndSendInvite = createAndSendInviteFactory({
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

  const createInvite = createWorkspaceInviteFactory({
    createAndSendInvite
  })

  return await captureCreatedInvite(
    async () =>
      await createInvite({
        ...args,
        inviterId,
        inviterResourceAccessRules: null
      })
  )
}

export const createTestOidcProvider = async (
  workspaceId: string,
  providerData: Partial<OidcProvider> = {}
) => {
  const providerId = cryptoRandomString({ length: 9 })
  await storeSsoProviderRecordFactory({ db, encrypt: getEncryptor() })({
    providerRecord: {
      id: providerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      sessionTimeoutDays: 7,
      providerType: 'oidc',
      provider: {
        providerName: 'Test Provider',
        clientId: 'test-provider',
        clientSecret: cryptoRandomString({ length: 12 }),
        issuerUrl: new URL('', getFrontendOrigin()).toString(),
        ...providerData
      }
    }
  })
  await associateSsoProviderWithWorkspaceFactory({ db })({
    workspaceId,
    providerId
  })
  return providerId
}

export const createTestSsoSession = async (
  userId: string,
  workspaceId: string,
  validUntil?: Date
) => {
  const { providerId } =
    (await getWorkspaceSsoProviderRecordFactory({ db })({ workspaceId })) ?? {}
  if (!providerId) throw new Error('No provider found')
  await upsertUserSsoSessionFactory({ db })({
    userSsoSession: {
      userId,
      providerId,
      createdAt: new Date(),
      validUntil: validUntil ?? getDefaultSsoSessionExpirationDate()
    }
  })
}
