import {
  deleteProjectRoleFactory,
  getStreamFactory,
  getStreamsCollaboratorCountsFactory,
  grantStreamPermissionsFactory,
  legacyGetStreamsFactory,
  revokeStreamPermissionsFactory,
  upsertProjectRoleFactory
} from '@/modules/core/repositories/streams'
import {
  CountWorkspaceRoleWithOptionalProjectRole,
  GetDefaultRegion,
  GetWorkspace,
  GetWorkspaceRoleForUser,
  GetWorkspaceRoleToDefaultProjectRoleMapping,
  GetWorkspaceSeatTypeToProjectRoleMapping,
  QueryAllWorkspaceProjects,
  ValidateWorkspaceMemberProjectRole
} from '@/modules/workspaces/domain/operations'
import {
  ServerInvitesEvents,
  ServerInvitesEventsPayloads
} from '@/modules/serverinvites/domain/events'
import {
  isProjectResourceTarget,
  resolveTarget
} from '@/modules/serverinvites/helpers/core'
import { logger, moduleLogger } from '@/observability/logging'
import { updateWorkspaceRoleFactory } from '@/modules/workspaces/services/management'
import { EventPayload, getEventBus } from '@/modules/shared/services/eventBus'
import { WorkspaceInviteResourceType } from '@/modules/workspacesCore/domain/constants'
import { Roles, throwUncoveredError, WorkspaceRoles } from '@speckle/shared'
import {
  DeleteProjectRole,
  UpsertProjectRole
} from '@/modules/core/domain/projects/operations'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import { Knex } from 'knex'
import {
  countWorkspaceRoleWithOptionalProjectRoleFactory,
  getWorkspaceFactory,
  getWorkspaceRoleForUserFactory,
  getWorkspaceRolesFactory,
  getWorkspaceWithDomainsFactory,
  upsertWorkspaceRoleFactory
} from '@/modules/workspaces/repositories/workspaces'
import {
  queryAllWorkspaceProjectsFactory,
  getWorkspaceRoleToDefaultProjectRoleMappingFactory,
  getWorkspaceSeatTypeToProjectRoleMappingFactory,
  validateWorkspaceMemberProjectRoleFactory
} from '@/modules/workspaces/services/projects'
import { withTransaction } from '@/modules/shared/helpers/dbHelper'
import {
  findEmailsByUserIdFactory,
  findVerifiedEmailsByUserIdFactory
} from '@/modules/core/repositories/userEmails'
import {
  GetStream,
  GetStreamsCollaboratorCounts,
  SetStreamCollaborator
} from '@/modules/core/domain/streams/operations'
import {
  GetUserSsoSession,
  GetWorkspaceSsoProviderRecord
} from '@/modules/workspaces/domain/sso/operations'
import { isValidSsoSession } from '@/modules/workspaces/domain/sso/logic'
import { SsoSessionMissingOrExpiredError } from '@/modules/workspaces/errors/sso'
import {
  getUserSsoSessionFactory,
  getWorkspaceSsoProviderRecordFactory
} from '@/modules/workspaces/repositories/sso'
import { WorkspacesNotAuthorizedError } from '@/modules/workspaces/errors/workspace'
import { publish, WorkspaceSubscriptions } from '@/modules/shared/utils/subscriptions'
import { isWorkspaceResourceTarget } from '@/modules/workspaces/services/invites'
import {
  ProjectEvents,
  ProjectEventsPayloads
} from '@/modules/core/domain/projects/events'
import { getBaseTrackingProperties, getClient } from '@/modules/shared/utils/mixpanel'
import {
  calculateSubscriptionSeats,
  GetWorkspacePlan,
  GetWorkspaceRolesAndSeats,
  GetWorkspaceSubscription,
  GetWorkspaceWithPlan
} from '@/modules/gatekeeper/domain/billing'
import { getWorkspacePlanProductId } from '@/modules/gatekeeper/stripe'
import { Workspace } from '@/modules/workspacesCore/domain/types'
import { FindEmailsByUserId } from '@/modules/core/domain/userEmails/operations'
import { getDefaultRegionFactory } from '@/modules/workspaces/repositories/regions'
import {
  getWorkspacePlanFactory,
  getWorkspaceSubscriptionFactory,
  getWorkspaceWithPlanFactory,
  upsertUnpaidWorkspacePlanFactory
} from '@/modules/gatekeeper/repositories/billing'
import { ensureValidWorkspaceRoleSeatFactory } from '@/modules/workspaces/services/workspaceSeat'
import {
  createWorkspaceSeatFactory,
  deleteWorkspaceSeatFactory,
  getWorkspaceRoleAndSeatFactory,
  getWorkspaceRolesAndSeatsFactory,
  getWorkspaceUserSeatFactory
} from '@/modules/gatekeeper/repositories/workspaceSeat'
import { DeleteWorkspaceSeat } from '@/modules/gatekeeper/domain/operations'
import {
  isStreamCollaboratorFactory,
  setStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import { getUserFactory } from '@/modules/core/repositories/users'
import { authorizeResolver } from '@/modules/shared'
import { isNewPlanType } from '@/modules/gatekeeper/helpers/plans'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'

const { FF_BILLING_INTEGRATION_ENABLED } = getFeatureFlags()

export const onProjectCreatedFactory =
  (deps: {
    getWorkspaceRolesAndSeats: GetWorkspaceRolesAndSeats
    upsertProjectRole: UpsertProjectRole
    getWorkspaceRoleToDefaultProjectRoleMapping: GetWorkspaceRoleToDefaultProjectRoleMapping
    getWorkspaceWithPlan: GetWorkspaceWithPlan
  }) =>
  async (payload: ProjectEventsPayloads[typeof ProjectEvents.Created]) => {
    const { id: projectId, workspaceId } = payload.project

    if (!workspaceId) {
      return
    }

    // Automatic role assignment doesn't apply to new plans
    const workspace = await deps.getWorkspaceWithPlan({ workspaceId })
    if (workspace?.plan && isNewPlanType(workspace.plan.name)) return

    const workspaceMembers = Object.values(
      await deps.getWorkspaceRolesAndSeats({ workspaceId })
    )

    const { default: defaultProjectRoles } =
      await deps.getWorkspaceRoleToDefaultProjectRoleMapping({
        workspaceId
      })

    // On create assign project roles to all members
    await Promise.all(
      workspaceMembers.map(({ userId, role: { role: workspaceRole } }) => {
        const projectRole = defaultProjectRoles[workspaceRole]
        if (!projectRole) return

        // we do not need to assign new roles to the project owner
        if (userId === payload.ownerId) return

        return deps.upsertProjectRole({
          projectId,
          userId,
          role: projectRole
        })
      })
    )
  }

export const onInviteFinalizedFactory =
  (deps: {
    getStream: GetStream
    logger: typeof logger
    updateWorkspaceRole: ReturnType<typeof updateWorkspaceRoleFactory>
  }) =>
  async (
    payload: ServerInvitesEventsPayloads[typeof ServerInvitesEvents.Finalized]
  ) => {
    const { invite, accept } = payload

    const resourceTarget = invite.resource
    if (!accept || !isProjectResourceTarget(resourceTarget)) {
      return
    }
    const targetUserId = resolveTarget(invite.target).userId!

    const project = await deps.getStream({
      streamId: resourceTarget.resourceId,
      userId: targetUserId
    })
    if (!project || !project.role) {
      deps.logger.warn(
        `When handling accepted invite - project not found or user is not a collaborator`,
        { invite, project: { id: project?.id, role: project?.role } }
      )
      return
    }
    if (!project.workspaceId) return

    const workspaceRole =
      resourceTarget.secondaryResourceRoles?.[WorkspaceInviteResourceType] ||
      Roles.Workspace.Guest

    // Add user to workspace
    await deps.updateWorkspaceRole({
      role: workspaceRole,
      userId: targetUserId,
      workspaceId: project.workspaceId,
      skipProjectRoleUpdatesFor: [project.id],
      updatedByUserId: invite.inviterId
    })
  }

export const onWorkspaceAuthorizedFactory =
  ({
    getWorkspace,
    getWorkspaceRoleForUser,
    getWorkspaceSsoProviderRecord,
    getUserSsoSession
  }: {
    getWorkspace: GetWorkspace
    getWorkspaceRoleForUser: GetWorkspaceRoleForUser
    getWorkspaceSsoProviderRecord: GetWorkspaceSsoProviderRecord
    getUserSsoSession: GetUserSsoSession
  }) =>
  async ({ userId, workspaceId }: { userId: string | null; workspaceId: string }) => {
    if (!userId) throw new WorkspacesNotAuthorizedError()

    // Guests cannot use (and are not restricted by) SSO
    const workspaceRole = await getWorkspaceRoleForUser({ userId, workspaceId })
    if (!workspaceRole) throw new WorkspacesNotAuthorizedError()
    if (workspaceRole?.role === Roles.Workspace.Guest) return

    const provider = await getWorkspaceSsoProviderRecord({ workspaceId })
    if (!provider) return

    const session = await getUserSsoSession({ userId, workspaceId })
    if (!session || !isValidSsoSession(session)) {
      const workspace = await getWorkspace({ workspaceId })
      throw new SsoSessionMissingOrExpiredError(workspace?.slug, {
        info: {
          workspaceSlug: workspace?.slug
        }
      })
    }
  }

export const onWorkspaceRoleDeletedFactory =
  ({
    queryAllWorkspaceProjects,
    deleteProjectRole,
    deleteWorkspaceSeat
  }: {
    queryAllWorkspaceProjects: QueryAllWorkspaceProjects
    deleteProjectRole: DeleteProjectRole
    deleteWorkspaceSeat: DeleteWorkspaceSeat
  }) =>
  async ({ userId, workspaceId }: { userId: string; workspaceId: string }) => {
    // Delete roles for all workspace projects
    for await (const projectsPage of queryAllWorkspaceProjects({
      workspaceId
    })) {
      await Promise.all(
        projectsPage.map(({ id: projectId }) =>
          deleteProjectRole({ projectId, userId })
        )
      )
    }

    // Delete seat
    await deleteWorkspaceSeat({ userId, workspaceId })
  }

export const onWorkspaceSeatUpdatedFactory =
  (deps: {
    getWorkspaceSeatTypeToProjectRoleMapping: GetWorkspaceSeatTypeToProjectRoleMapping
    queryAllWorkspaceProjects: QueryAllWorkspaceProjects
    setStreamCollaborator: SetStreamCollaborator
    getWorkspaceWithPlan: GetWorkspaceWithPlan
    getWorkspaceRoleForUser: GetWorkspaceRoleForUser
  }) =>
  async (params: EventPayload<typeof WorkspaceEvents.SeatUpdated>) => {
    const { seat, updatedByUserId } = params.payload
    const { userId, type: seatType, workspaceId } = seat

    const [workspace, role] = await Promise.all([
      deps.getWorkspaceWithPlan({ workspaceId }),
      deps.getWorkspaceRoleForUser({ userId, workspaceId })
    ])
    if (!workspace || !role) return

    // Only new plans only rely on seat types
    const isNewPlan = workspace.plan && isNewPlanType(workspace.plan.name)
    if (!isNewPlan) {
      return
    }

    const { allowed: allowedProjectRoles, default: defaultProjectRoles } =
      await deps.getWorkspaceSeatTypeToProjectRoleMapping({
        workspaceId
      })

    // Ensure project roles are valid on seat type switch
    for await (const projectsPage of deps.queryAllWorkspaceProjects({
      workspaceId,
      userId
    })) {
      await Promise.all(
        projectsPage.map(async ({ id: projectId, role: originalProjectRole }) => {
          const disallowedProjectRole =
            originalProjectRole &&
            !allowedProjectRoles[seatType].includes(originalProjectRole)
          if (!disallowedProjectRole) return

          const newRole = defaultProjectRoles[seatType]
          await deps.setStreamCollaborator(
            {
              streamId: projectId,
              userId,
              role: newRole,
              setByUserId: updatedByUserId
            },
            { trackProjectUpdate: false, skipAuthorization: true }
          )
        })
      )
    }
  }

export const onWorkspaceRoleUpdatedFactory =
  (deps: {
    getWorkspaceRoleToDefaultProjectRoleMapping: GetWorkspaceRoleToDefaultProjectRoleMapping
    queryAllWorkspaceProjects: QueryAllWorkspaceProjects
    setStreamCollaborator: SetStreamCollaborator
    getStreamsCollaboratorCounts: GetStreamsCollaboratorCounts
    getWorkspaceWithPlan: GetWorkspaceWithPlan
  }) =>
  async ({
    acl,
    flags,
    updatedByUserId
  }: {
    acl: { userId: string; role: WorkspaceRoles; workspaceId: string }
    flags?: {
      skipProjectRoleUpdatesFor: string[]
    }
    updatedByUserId: string
  }) => {
    const { userId, role, workspaceId } = acl
    const workspace = await deps.getWorkspaceWithPlan({ workspaceId })
    if (!workspace) return

    // New plans don't do automatic project role assignment
    const isNewPlan = workspace.plan && isNewPlanType(workspace.plan.name)
    if (isNewPlan) {
      return
    }

    const { default: defaultProjectRoles } =
      await deps.getWorkspaceRoleToDefaultProjectRoleMapping({
        workspaceId
      })

    const nextUserRole = defaultProjectRoles[role]

    // Keep user's project roles in sync with their workspace role
    for await (const projectsPage of deps.queryAllWorkspaceProjects({
      workspaceId,
      userId
    })) {
      const projectsOldOwnerCounts = await deps.getStreamsCollaboratorCounts({
        streamIds: projectsPage.map((p) => p.id),
        type: Roles.Stream.Owner
      })

      await Promise.all(
        projectsPage.map(async ({ id: projectId, role: originalProjectRole }) => {
          if (flags?.skipProjectRoleUpdatesFor.includes(projectId)) {
            // Skip assignment (used during invite flow)
            // TODO: Can we refactor this special case away?
            return
          }

          // If downgraded from owner & last owner, transfer ownership to admin causing the role update (updatedByUserId)
          const isNoLongerOwner =
            originalProjectRole === Roles.Stream.Owner &&
            (!nextUserRole || nextUserRole !== Roles.Stream.Owner)
          const wasLastOwner =
            projectsOldOwnerCounts[projectId]?.[Roles.Stream.Owner] === 1
          if (isNoLongerOwner && wasLastOwner) {
            await deps.setStreamCollaborator(
              {
                streamId: projectId,
                userId: updatedByUserId,
                role: Roles.Stream.Owner,
                setByUserId: updatedByUserId
              },
              { trackProjectUpdate: false, skipAuthorization: true }
            )
          }

          // Finally change target role
          await deps.setStreamCollaborator(
            {
              streamId: projectId,
              userId,
              role: nextUserRole,
              setByUserId: updatedByUserId
            },
            { trackProjectUpdate: false, skipAuthorization: true }
          )
        })
      )
    }
  }

export const workspaceTrackingFactory =
  ({
    getWorkspace,
    countWorkspaceRole,
    getDefaultRegion,
    getWorkspacePlan,
    getWorkspaceSubscription,
    getUserEmails
  }: {
    getWorkspace: GetWorkspace
    countWorkspaceRole: CountWorkspaceRoleWithOptionalProjectRole
    getDefaultRegion: GetDefaultRegion
    getWorkspacePlan: GetWorkspacePlan
    getWorkspaceSubscription: GetWorkspaceSubscription
    getUserEmails: FindEmailsByUserId
  }) =>
  async (params: EventPayload<'workspace.*'> | EventPayload<'gatekeeper.*'>) => {
    // temp ignoring tracking for this, if billing is not enabled
    // this should be sorted with a better separation between workspaces and the gatekeeper module
    if (!FF_BILLING_INTEGRATION_ENABLED) return
    const { eventName, payload } = params
    const mixpanel = getClient()
    if (!mixpanel) return
    const calculateProperties = async (workspace: Workspace) => {
      const workspaceId = workspace.id
      const [adminCount, memberCount, guestCount, defaultRegion, plan, subscription] =
        await Promise.all([
          countWorkspaceRole({ workspaceId, workspaceRole: Roles.Workspace.Admin }),
          countWorkspaceRole({ workspaceId, workspaceRole: Roles.Workspace.Member }),
          countWorkspaceRole({ workspaceId, workspaceRole: Roles.Workspace.Guest }),
          getDefaultRegion({ workspaceId }),
          getWorkspacePlan({ workspaceId }),
          getWorkspaceSubscription({ workspaceId })
        ])
      const seats = subscription?.subscriptionData
        ? calculateSubscriptionSeats({
            subscriptionData: subscription?.subscriptionData,
            guestSeatProductId: getWorkspacePlanProductId({ workspacePlan: 'guest' })
          })
        : { plan: 0, guest: 0 }
      return {
        name: workspace.name,
        description: workspace.description,
        domainBasedMembershipProtectionEnabled:
          workspace.domainBasedMembershipProtectionEnabled,
        discoverabilityEnabled: workspace.discoverabilityEnabled,
        defaultRegionKey: defaultRegion?.key,
        teamTotalCount: adminCount + memberCount + guestCount,
        teamAdminCount: adminCount,
        teamMemberCount: memberCount,
        teamGuestCount: guestCount,
        planName: plan?.name || '',
        planStatus: plan?.status || '',
        planCreatedAt: plan?.createdAt,
        subscriptionBillingInterval: subscription?.billingInterval,
        subscriptionCurrentBillingCycleEnd: subscription?.currentBillingCycleEnd,
        seats: seats.plan,
        seatsGuest: seats.guest,
        ...getBaseTrackingProperties()
      }
    }
    const checkForSpeckleMembers = async ({
      userId
    }: {
      userId: string
    }): Promise<{ hasSpeckleMembers: boolean }> => {
      const userEmails = await getUserEmails({ userId })
      return {
        hasSpeckleMembers: userEmails.some((e) => e.email.endsWith('@speckle.systems'))
      }
    }
    switch (eventName) {
      case 'gatekeeper.workspace-plan-updated':
        const updatedPlanWorkspace = await getWorkspace({
          workspaceId: payload.workspacePlan.workspaceId
        })
        if (!updatedPlanWorkspace) break
        mixpanel.groups.set(
          'workspace_id',
          payload.workspacePlan.workspaceId,
          await calculateProperties(updatedPlanWorkspace)
        )
        break
      case 'gatekeeper.workspace-trial-expired':
        break
      case WorkspaceEvents.Authorizing:
        break
      case 'workspace.created':
        // we're setting workspace props and attributing to speckle users
        mixpanel.groups.set('workspace_id', payload.workspace.id, {
          ...(await calculateProperties(payload.workspace)),
          ...(await checkForSpeckleMembers({ userId: payload.createdByUserId }))
        })
        break
      case 'workspace.updated':
        // just updating workspace props
        mixpanel.groups.set(
          'workspace_id',
          payload.workspace.id,
          await calculateProperties(payload.workspace)
        )
        break
      case 'workspace.deleted':
        // just marking workspace deleted
        mixpanel.groups.set('workspace_id', payload.workspaceId, {
          isDeleted: true,
          ...getBaseTrackingProperties()
        })
        break
      case 'workspace.role-deleted':
      case 'workspace.role-updated':
      case WorkspaceEvents.SeatUpdated:
        const entity = 'acl' in payload ? payload.acl : payload.seat

        const speckleMembers = await checkForSpeckleMembers({
          userId: entity.userId
        })
        const workspace = await getWorkspace({ workspaceId: entity.workspaceId })
        if (!workspace) break
        mixpanel.groups.set('workspace_id', entity.workspaceId, {
          ...(await calculateProperties(workspace)),
          // only marking has speckle members to true
          // calculating this for speckle member removal would require getting all users
          // that is too costly in here imho
          ...(speckleMembers.hasSpeckleMembers ? speckleMembers : {})
        })
        break
      case 'workspace.joined-from-discovery':
        break
      default:
        throwUncoveredError(eventName)
    }
  }

const emitWorkspaceGraphqlSubscriptionsFactory =
  (deps: { getWorkspace: GetWorkspace }) => async (params: EventPayload<'**'>) => {
    const { eventName, payload } = params
    switch (eventName) {
      case WorkspaceEvents.Updated:
        await publish(WorkspaceSubscriptions.WorkspaceUpdated, {
          workspaceUpdated: {
            workspace: payload.workspace,
            id: payload.workspace.id
          }
        })
        break
      case WorkspaceEvents.RoleDeleted:
      case WorkspaceEvents.RoleUpdated:
        const { workspaceId } = payload.acl
        const foundWorkspace = await deps.getWorkspace({ workspaceId })
        if (foundWorkspace) {
          await publish(WorkspaceSubscriptions.WorkspaceUpdated, {
            workspaceUpdated: {
              workspace: foundWorkspace,
              id: foundWorkspace.id
            }
          })
        }
        break
      case ServerInvitesEvents.Created:
      case ServerInvitesEvents.Canceled:
      case ServerInvitesEvents.Finalized:
        const { invite } = payload
        if (!isWorkspaceResourceTarget(invite.resource)) return

        const res = invite.resource
        const newInviteWorkspace = await deps.getWorkspace({
          workspaceId: res.resourceId
        })
        if (newInviteWorkspace) {
          await publish(WorkspaceSubscriptions.WorkspaceUpdated, {
            workspaceUpdated: {
              workspace: newInviteWorkspace,
              id: newInviteWorkspace.id
            }
          })
        }

        break
    }
  }

const blockInvalidWorkspaceProjectRoleUpdatesFactory =
  (deps: {
    getStream: GetStream
    validateWorkspaceMemberProjectRole: ValidateWorkspaceMemberProjectRole
  }) =>
  async ({ payload }: EventPayload<typeof ProjectEvents.PermissionsBeingAdded>) => {
    const project = await deps.getStream({ streamId: payload.projectId })
    if (!project?.workspaceId) return // No extra validation necessary

    await deps.validateWorkspaceMemberProjectRole({
      userId: payload.targetUserId,
      projectRole: payload.role,
      workspaceId: project.workspaceId
    })
  }

export const initializeEventListenersFactory =
  ({ db }: { db: Knex }) =>
  () => {
    const eventBus = getEventBus()
    const getStreams = legacyGetStreamsFactory({ db })
    const getWorkspace = getWorkspaceFactory({ db })
    const emitWorkspaceGraphqlSubscriptions = emitWorkspaceGraphqlSubscriptionsFactory({
      getWorkspace
    })
    const getStream = getStreamFactory({ db })
    const getWorkspaceUserSeat = getWorkspaceUserSeatFactory({ db })
    const getWorkspacePlan = getWorkspacePlanFactory({ db })
    const getWorkspaceWithPlan = getWorkspaceWithPlanFactory({ db })

    const blockInvalidWorkspaceProjectRoleUpdates =
      blockInvalidWorkspaceProjectRoleUpdatesFactory({
        getStream,
        validateWorkspaceMemberProjectRole: validateWorkspaceMemberProjectRoleFactory({
          getWorkspaceRoleAndSeat: getWorkspaceRoleAndSeatFactory({ db }),
          getWorkspaceRoleToDefaultProjectRoleMapping:
            getWorkspaceRoleToDefaultProjectRoleMappingFactory({
              getWorkspaceWithPlan
            }),
          getWorkspaceSeatTypeToProjectRoleMapping:
            getWorkspaceSeatTypeToProjectRoleMappingFactory({
              getWorkspaceWithPlan
            }),
          getWorkspaceWithPlan
        })
      })
    const createWorkspaceSeat = createWorkspaceSeatFactory({ db })
    const ensureValidWorkspaceRoleSeat = ensureValidWorkspaceRoleSeatFactory({
      createWorkspaceSeat,
      getWorkspaceUserSeat,
      eventEmit: eventBus.emit
    })

    const quitCbs = [
      eventBus.listen(ProjectEvents.Created, async ({ payload }) => {
        const onProjectCreated = onProjectCreatedFactory({
          upsertProjectRole: upsertProjectRoleFactory({ db }),
          getWorkspaceRolesAndSeats: getWorkspaceRolesAndSeatsFactory({ db }),
          getWorkspaceRoleToDefaultProjectRoleMapping:
            getWorkspaceRoleToDefaultProjectRoleMappingFactory({
              getWorkspaceWithPlan
            }),
          getWorkspaceWithPlan
        })
        await onProjectCreated(payload)
      }),
      eventBus.listen(ServerInvitesEvents.Finalized, async ({ payload }) => {
        const onInviteFinalized = onInviteFinalizedFactory({
          getStream: getStreamFactory({ db }),
          logger: moduleLogger,
          updateWorkspaceRole: updateWorkspaceRoleFactory({
            getWorkspaceWithDomains: getWorkspaceWithDomainsFactory({ db }),
            findVerifiedEmailsByUserId: findVerifiedEmailsByUserIdFactory({ db }),
            getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
            upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
            emitWorkspaceEvent: (...args) => getEventBus().emit(...args),
            ensureValidWorkspaceRoleSeat
          })
        })
        await onInviteFinalized(payload)
      }),
      eventBus.listen('workspace.*', async (payload) => {
        await workspaceTrackingFactory({
          countWorkspaceRole: countWorkspaceRoleWithOptionalProjectRoleFactory({ db }),
          getDefaultRegion: getDefaultRegionFactory({ db }),
          getUserEmails: findEmailsByUserIdFactory({ db }),
          getWorkspace: getWorkspaceFactory({ db }),
          getWorkspacePlan,
          getWorkspaceSubscription: getWorkspaceSubscriptionFactory({ db })
        })(payload)
      }),
      eventBus.listen('gatekeeper.*', async (payload) => {
        await workspaceTrackingFactory({
          countWorkspaceRole: countWorkspaceRoleWithOptionalProjectRoleFactory({ db }),
          getDefaultRegion: getDefaultRegionFactory({ db }),
          getUserEmails: findEmailsByUserIdFactory({ db }),
          getWorkspace: getWorkspaceFactory({ db }),
          getWorkspacePlan,
          getWorkspaceSubscription: getWorkspaceSubscriptionFactory({ db })
        })(payload)
      }),
      eventBus.listen(WorkspaceEvents.Authorizing, async ({ payload }) => {
        const onWorkspaceAuthorized = onWorkspaceAuthorizedFactory({
          getWorkspace,
          getWorkspaceRoleForUser: getWorkspaceRoleForUserFactory({ db }),
          getWorkspaceSsoProviderRecord: getWorkspaceSsoProviderRecordFactory({ db }),
          getUserSsoSession: getUserSsoSessionFactory({ db })
        })
        await onWorkspaceAuthorized(payload)
      }),
      eventBus.listen(WorkspaceEvents.Created, async ({ payload }) => {
        await upsertUnpaidWorkspacePlanFactory({ db })({
          workspacePlan: {
            name: 'free',
            status: 'valid',
            workspaceId: payload.workspace.id,
            createdAt: new Date()
          }
        })
      }),
      eventBus.listen(WorkspaceEvents.RoleDeleted, async ({ payload }) => {
        const trx = await db.transaction()
        const onWorkspaceRoleDeleted = onWorkspaceRoleDeletedFactory({
          queryAllWorkspaceProjects: queryAllWorkspaceProjectsFactory({ getStreams }),
          deleteProjectRole: deleteProjectRoleFactory({ db: trx }),
          deleteWorkspaceSeat: deleteWorkspaceSeatFactory({ db: trx })
        })
        await withTransaction(onWorkspaceRoleDeleted(payload.acl), trx)
      }),
      eventBus.listen(WorkspaceEvents.RoleUpdated, async ({ payload }) => {
        const trx = await db.transaction()
        const onWorkspaceRoleUpdated = onWorkspaceRoleUpdatedFactory({
          getWorkspaceWithPlan: getWorkspaceWithPlanFactory({ db }),
          getWorkspaceRoleToDefaultProjectRoleMapping:
            getWorkspaceRoleToDefaultProjectRoleMappingFactory({
              getWorkspaceWithPlan: getWorkspaceWithPlanFactory({ db })
            }),
          queryAllWorkspaceProjects: queryAllWorkspaceProjectsFactory({ getStreams }),
          setStreamCollaborator: setStreamCollaboratorFactory({
            getUser: getUserFactory({ db }),
            validateStreamAccess: validateStreamAccessFactory({ authorizeResolver }),
            emitEvent: eventBus.emit,
            grantStreamPermissions: grantStreamPermissionsFactory({ db: trx }),
            isStreamCollaborator: isStreamCollaboratorFactory({
              getStream: getStreamFactory({ db })
            }),
            revokeStreamPermissions: revokeStreamPermissionsFactory({ db: trx })
          }),
          getStreamsCollaboratorCounts: getStreamsCollaboratorCountsFactory({ db })
        })
        await withTransaction(onWorkspaceRoleUpdated(payload), trx)
      }),
      eventBus.listen(WorkspaceEvents.SeatUpdated, async (payload) => {
        const trx = await db.transaction()
        const onWorkspaceSeatUpdated = onWorkspaceSeatUpdatedFactory({
          setStreamCollaborator: setStreamCollaboratorFactory({
            getUser: getUserFactory({ db }),
            validateStreamAccess: validateStreamAccessFactory({ authorizeResolver }),
            emitEvent: eventBus.emit,
            grantStreamPermissions: grantStreamPermissionsFactory({ db: trx }),
            isStreamCollaborator: isStreamCollaboratorFactory({
              getStream: getStreamFactory({ db })
            }),
            revokeStreamPermissions: revokeStreamPermissionsFactory({ db: trx })
          }),
          queryAllWorkspaceProjects: queryAllWorkspaceProjectsFactory({ getStreams }),
          getWorkspaceWithPlan: getWorkspaceWithPlanFactory({ db }),
          getWorkspaceRoleForUser: getWorkspaceRoleForUserFactory({ db }),
          getWorkspaceSeatTypeToProjectRoleMapping:
            getWorkspaceSeatTypeToProjectRoleMappingFactory({
              getWorkspaceWithPlan: getWorkspaceWithPlanFactory({ db })
            })
        })

        await withTransaction(onWorkspaceSeatUpdated(payload), trx)
      }),
      eventBus.listen('**', emitWorkspaceGraphqlSubscriptions),
      eventBus.listen(
        ProjectEvents.PermissionsBeingAdded,
        blockInvalidWorkspaceProjectRoleUpdates
      )
    ]

    return () => quitCbs.forEach((quit) => quit())
  }
