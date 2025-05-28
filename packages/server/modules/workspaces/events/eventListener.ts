import {
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
  GetProjectWorkspace,
  GetWorkspace,
  GetWorkspaceCollaborators,
  GetWorkspaceModelCount,
  GetWorkspaceRoleForUser,
  GetWorkspaceSeatCount,
  GetWorkspaceSeatTypeToProjectRoleMapping,
  GetWorkspacesProjectsCounts,
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
import { addOrUpdateWorkspaceRoleFactory } from '@/modules/workspaces/services/management'
import { EventPayload, getEventBus } from '@/modules/shared/services/eventBus'
import { WorkspaceInviteResourceType } from '@/modules/workspacesCore/domain/constants'
import {
  MaybeNullOrUndefined,
  resolveMixpanelUserId,
  Roles,
  StreamRoles,
  throwUncoveredError,
  WorkspaceRoles
} from '@speckle/shared'
import { UpsertProjectRole } from '@/modules/core/domain/projects/operations'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import { Knex } from 'knex'
import {
  countWorkspaceRoleWithOptionalProjectRoleFactory,
  getWorkspaceCollaboratorsFactory,
  getWorkspaceFactory,
  getWorkspaceRoleForUserFactory,
  getWorkspaceRolesFactory,
  getWorkspaceSeatCountFactory,
  getWorkspacesProjectsCountsFactory,
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
  findPrimaryEmailForUserFactory,
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
import { ProjectEvents } from '@/modules/core/domain/projects/events'
import {
  getBaseTrackingProperties,
  getClient,
  MixpanelEvents
} from '@/modules/shared/utils/mixpanel'
import {
  GetWorkspacePlan,
  GetWorkspaceSubscription,
  GetWorkspaceWithPlan
} from '@/modules/gatekeeper/domain/billing'
import { Workspace, WorkspaceSeatType } from '@/modules/workspacesCore/domain/types'
import {
  FindEmailsByUserId,
  FindPrimaryEmailForUser
} from '@/modules/core/domain/userEmails/operations'
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
  getWorkspaceUserSeatFactory
} from '@/modules/gatekeeper/repositories/workspaceSeat'
import {
  DeleteWorkspaceSeat,
  GetWorkspaceUserSeat
} from '@/modules/gatekeeper/domain/operations'
import {
  isStreamCollaboratorFactory,
  setStreamCollaboratorFactory,
  validateStreamAccessFactory
} from '@/modules/core/services/streams/access'
import { getUserFactory } from '@/modules/core/repositories/users'
import { authorizeResolver } from '@/modules/shared'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { getProjectWorkspaceFactory } from '@/modules/workspaces/repositories/projects'
import { getWorkspaceModelCountFactory } from '@/modules/workspaces/services/workspaceLimits'
import { getPaginatedProjectModelsTotalCountFactory } from '@/modules/core/repositories/branches'
import {
  buildWorkspaceTrackingPropertiesFactory,
  WORKSPACE_TRACKING_ID_KEY
} from '@/modules/workspaces/services/tracking'
import { assign } from 'lodash'
import { WorkspacePlanStatuses } from '@/modules/cross-server-sync/graph/generated/graphql'
import { Mixpanel } from 'mixpanel'

const { FF_BILLING_INTEGRATION_ENABLED } = getFeatureFlags()

export const onInviteFinalizedFactory =
  (deps: {
    getStream: GetStream
    logger: typeof logger
    updateWorkspaceRole: ReturnType<typeof addOrUpdateWorkspaceRoleFactory>
    getWorkspaceRole: GetWorkspaceRoleForUser
    upsertProjectRole: UpsertProjectRole
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
      preventRoleDowngrade: true,
      updatedByUserId: invite.inviterId
    })

    // Automatically promote user to project owner if workspace admin
    const finalWorkspaceRole = await deps.getWorkspaceRole({
      userId: targetUserId,
      workspaceId: project.workspaceId
    })
    if (finalWorkspaceRole?.role === Roles.Workspace.Admin) {
      await deps.upsertProjectRole({
        projectId: project.id,
        userId: targetUserId,
        role: Roles.Stream.Owner
      })
    }
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
  (deps: {
    queryAllWorkspaceProjects: QueryAllWorkspaceProjects
    deleteWorkspaceSeat: DeleteWorkspaceSeat
    getStreamsCollaboratorCounts: GetStreamsCollaboratorCounts
    getWorkspaceCollaborators: GetWorkspaceCollaborators
    setStreamCollaborator: SetStreamCollaborator
  }) =>
  async ({
    acl: { userId, workspaceId },
    updatedByUserId
  }: {
    acl: { userId: string; workspaceId: string }
    updatedByUserId: string
  }) => {
    // Resolve a fallback admin
    const [admin] = await deps.getWorkspaceCollaborators({
      workspaceId,
      limit: 1,
      filter: {
        roles: [Roles.Workspace.Admin],
        excludeUserIds: [userId]
      }
    })

    // Delete roles for all workspace projects
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
          // If downgraded from owner & last owner, transfer ownership to a workspace admin
          const isNoLongerOwner = originalProjectRole === Roles.Stream.Owner
          const wasLastOwner =
            projectsOldOwnerCounts[projectId]?.[Roles.Stream.Owner] === 1
          if (isNoLongerOwner && wasLastOwner) {
            await deps.setStreamCollaborator(
              {
                streamId: projectId,
                userId: admin.id,
                role: Roles.Stream.Owner,
                setByUserId: updatedByUserId
              },
              { trackProjectUpdate: false, skipAuthorization: true }
            )
          }

          // Do actual role change for changed user
          await deps.setStreamCollaborator(
            {
              streamId: projectId,
              userId,
              role: null,
              setByUserId: updatedByUserId
            },
            { trackProjectUpdate: false, skipAuthorization: true }
          )
        })
      )
    }

    // Delete seat
    await deps.deleteWorkspaceSeat({ userId, workspaceId })
  }

export const onWorkspaceSeatUpdatedFactory =
  (deps: {
    getWorkspaceSeatTypeToProjectRoleMapping: GetWorkspaceSeatTypeToProjectRoleMapping
    queryAllWorkspaceProjects: QueryAllWorkspaceProjects
    setStreamCollaborator: SetStreamCollaborator
    getWorkspaceWithPlan: GetWorkspaceWithPlan
    getWorkspaceRoleForUser: GetWorkspaceRoleForUser
    getStreamsCollaboratorCounts: GetStreamsCollaboratorCounts
    getWorkspaceCollaborators: GetWorkspaceCollaborators
  }) =>
  async (params: EventPayload<typeof WorkspaceEvents.SeatUpdated>) => {
    const { seat, updatedByUserId } = params.payload
    const { userId, type: seatType, workspaceId } = seat

    const [workspace, role] = await Promise.all([
      deps.getWorkspaceWithPlan({ workspaceId }),
      deps.getWorkspaceRoleForUser({ userId, workspaceId })
    ])
    if (!workspace || !role) return

    const { allowed: allowedProjectRoles, default: defaultProjectRoles } =
      await deps.getWorkspaceSeatTypeToProjectRoleMapping({
        workspaceId
      })

    // Resolve a fallback admin
    const [admin] = await deps.getWorkspaceCollaborators({
      workspaceId,
      limit: 1,
      filter: {
        roles: [Roles.Workspace.Admin],
        excludeUserIds: [userId]
      }
    })

    // Ensure project roles are valid on seat type switch
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
          const disallowedProjectRole =
            originalProjectRole &&
            !allowedProjectRoles[seatType].includes(originalProjectRole)
          if (!disallowedProjectRole) return

          const nextUserRole = defaultProjectRoles[seatType]

          // If downgraded from owner & last owner, transfer ownership to a workspace admin
          const isNoLongerOwner =
            originalProjectRole === Roles.Stream.Owner &&
            nextUserRole !== Roles.Stream.Owner
          const wasLastOwner =
            projectsOldOwnerCounts[projectId]?.[Roles.Stream.Owner] === 1
          if (isNoLongerOwner && wasLastOwner) {
            await deps.setStreamCollaborator(
              {
                streamId: projectId,
                userId: admin.id,
                role: Roles.Stream.Owner,
                setByUserId: updatedByUserId
              },
              { trackProjectUpdate: false, skipAuthorization: true }
            )
          }

          // Do actual role change for changed user
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

export const onWorkspaceRoleUpdatedFactory =
  (deps: {
    queryAllWorkspaceProjects: QueryAllWorkspaceProjects
    setStreamCollaborator: SetStreamCollaborator
    getWorkspaceUserSeat: GetWorkspaceUserSeat
    getStreamsCollaboratorCounts: GetStreamsCollaboratorCounts
    getWorkspaceCollaborators: GetWorkspaceCollaborators
    getWorkspaceWithPlan: GetWorkspaceWithPlan
  }) =>
  async ({
    acl,
    updatedByUserId
  }: {
    acl: { userId: string; role: WorkspaceRoles; workspaceId: string }
    updatedByUserId: string
  }) => {
    const { userId, role, workspaceId } = acl

    const workspace = await deps.getWorkspaceWithPlan({ workspaceId })
    if (!workspace) return

    const seatType = await deps.getWorkspaceUserSeat({ workspaceId, userId })
    if (!seatType) return

    // Resolve a fallback admin
    const [admin] = await deps.getWorkspaceCollaborators({
      workspaceId,
      limit: 1,
      filter: {
        roles: [Roles.Workspace.Admin],
        excludeUserIds: [userId]
      }
    })

    // Enforce project roles based on workspace role and seat type, if project role exists
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
          if (!originalProjectRole) {
            return
          }

          /**
           * We cant really throw here, because by this point the workspace role has already
           * been written to DB. So we must ensure the updates we make here are valid
           */

          let nextUserRole: StreamRoles
          switch (role) {
            case Roles.Workspace.Admin: {
              // Set workspace owner as project owner
              nextUserRole = Roles.Stream.Owner
              break
            }
            case Roles.Workspace.Guest: {
              // If workspace guest is project owner
              if (originalProjectRole !== Roles.Stream.Owner) {
                return
              }

              // If workspace guest has an editor seat
              if (seatType.type !== WorkspaceSeatType.Editor) {
                return
              }

              // Demote to contributor
              nextUserRole = Roles.Stream.Contributor
              break
            }
            default:
              return
          }

          // If downgraded from owner & last owner, transfer ownership to a workspace admin
          const isNoLongerOwner =
            originalProjectRole === Roles.Stream.Owner &&
            nextUserRole !== Roles.Stream.Owner
          const wasLastOwner =
            projectsOldOwnerCounts[projectId]?.[Roles.Stream.Owner] === 1
          if (isNoLongerOwner && wasLastOwner) {
            await deps.setStreamCollaborator(
              {
                streamId: projectId,
                userId: admin.id,
                role: Roles.Stream.Owner,
                setByUserId: updatedByUserId
              },
              { trackProjectUpdate: false, skipAuthorization: true }
            )
          }

          // Do actual role change for changed user
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
    findPrimaryEmailForUser,
    getUserEmails,
    getWorkspaceModelCount,
    getWorkspacesProjectCount,
    getWorkspaceSeatCount,
    mixpanel = getClient(),
    getServerTrackingProperties = getBaseTrackingProperties
  }: {
    getWorkspace: GetWorkspace
    countWorkspaceRole: CountWorkspaceRoleWithOptionalProjectRole
    getDefaultRegion: GetDefaultRegion
    getWorkspacePlan: GetWorkspacePlan
    getWorkspaceSubscription: GetWorkspaceSubscription
    findPrimaryEmailForUser: FindPrimaryEmailForUser
    getUserEmails: FindEmailsByUserId
    getWorkspaceModelCount: GetWorkspaceModelCount
    getWorkspacesProjectCount: GetWorkspacesProjectsCounts
    getWorkspaceSeatCount: GetWorkspaceSeatCount
    mixpanel?: Mixpanel
    getServerTrackingProperties?: typeof getBaseTrackingProperties
  }) =>
  async (params: EventPayload<'workspace.*'> | EventPayload<'gatekeeper.*'>) => {
    // temp ignoring tracking for this, if billing is not enabled
    // this should be sorted with a better separation between workspaces and the gatekeeper module
    if (!FF_BILLING_INTEGRATION_ENABLED) return
    if (!mixpanel) return
    const { eventName, payload } = params

    const buildWorkspaceTrackingProperties = buildWorkspaceTrackingPropertiesFactory({
      countWorkspaceRole,
      getDefaultRegion,
      getWorkspacePlan,
      getWorkspaceSubscription,
      getWorkspaceModelCount,
      getWorkspacesProjectCount,
      getWorkspaceSeatCount
    })

    const getUserTrackingProperties = async ({ userId }: { userId: string }) => {
      const primaryEmail = await findPrimaryEmailForUser({ userId })
      if (!primaryEmail) return {}
      return {
        // eslint-disable-next-line camelcase
        user_id: resolveMixpanelUserId(primaryEmail.email)
      }
    }

    // only marking has speckle members to true
    // calculating this for speckle member removal would require getting all users
    // that is too costly in here imho
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
        const subscription = await getWorkspaceSubscription({
          workspaceId: payload.workspacePlan.workspaceId
        })
        mixpanel.groups.set(
          WORKSPACE_TRACKING_ID_KEY,
          payload.workspacePlan.workspaceId,
          await buildWorkspaceTrackingProperties(updatedPlanWorkspace)
        )
        mixpanel.track(
          MixpanelEvents.WorkspaceUpgraded,
          assign(
            {
              [WORKSPACE_TRACKING_ID_KEY]: payload.workspacePlan.workspaceId,
              plan: payload.workspacePlan.name,
              cycle: subscription?.billingInterval,
              previousPlan: payload.workspacePlan.previousPlanName
            },
            getServerTrackingProperties()
          )
        )
        break
      case 'gatekeeper.workspace-subscription-updated':
        if (payload.status === WorkspacePlanStatuses.Canceled) {
          mixpanel.track(
            MixpanelEvents.WorkspaceSubscriptionCanceled,
            assign(
              { [WORKSPACE_TRACKING_ID_KEY]: payload.workspaceId },
              getServerTrackingProperties()
            )
          )
        }

        if (payload.status === WorkspacePlanStatuses.CancelationScheduled) {
          mixpanel.track(
            MixpanelEvents.WorkspaceSubscriptionCancelationScheduled,
            assign(
              { [WORKSPACE_TRACKING_ID_KEY]: payload.workspaceId },
              getServerTrackingProperties()
            )
          )
        }
        break
      case 'gatekeeper.workspace-trial-expired':
        break
      case WorkspaceEvents.Authorizing:
        break
      case 'workspace.created':
        // we're setting workspace props and attributing to speckle users
        mixpanel.groups.set(
          WORKSPACE_TRACKING_ID_KEY,
          payload.workspace.id,
          assign(
            await buildWorkspaceTrackingProperties(payload.workspace),
            await checkForSpeckleMembers({ userId: payload.createdByUserId })
          )
        )
        mixpanel.track(
          MixpanelEvents.WorkspaceCreated,
          assign(
            { [WORKSPACE_TRACKING_ID_KEY]: payload.workspace.id },
            await getUserTrackingProperties({ userId: payload.createdByUserId }),
            getServerTrackingProperties()
          )
        )
        break
      case 'workspace.updated':
        // just updating workspace props
        mixpanel.groups.set(
          WORKSPACE_TRACKING_ID_KEY,
          payload.workspace.id,
          await buildWorkspaceTrackingProperties(payload.workspace)
        )
        break
      case 'workspace.deleted':
        // just marking workspace deleted
        mixpanel.groups.set(
          WORKSPACE_TRACKING_ID_KEY,
          payload.workspaceId,
          assign({ isDeleted: true }, getServerTrackingProperties())
        )
        mixpanel.track(MixpanelEvents.WorkspaceDeleted, {
          [WORKSPACE_TRACKING_ID_KEY]: payload.workspaceId
        })
        break
      case 'workspace.role-deleted':
      case 'workspace.role-updated':
      case WorkspaceEvents.SeatUpdated:
        const entity = 'acl' in payload ? payload.acl : payload.seat
        const workspace = await getWorkspace({ workspaceId: entity.workspaceId })
        if (!workspace) break

        mixpanel.groups.set(
          WORKSPACE_TRACKING_ID_KEY,
          entity.workspaceId,
          assign(
            await buildWorkspaceTrackingProperties(workspace),
            await checkForSpeckleMembers({ userId: entity.userId })
          )
        )
        break
      default:
        throwUncoveredError(eventName)
    }
  }

const emitWorkspaceGraphqlSubscriptionsFactory =
  (deps: { getWorkspace: GetWorkspace; getProjectWorkspace: GetProjectWorkspace }) =>
  async (params: EventPayload<'**'>) => {
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
        let workspace: MaybeNullOrUndefined<Workspace> = undefined
        if (isWorkspaceResourceTarget(invite.resource)) {
          workspace = await deps.getWorkspace({
            workspaceId: invite.resource.resourceId
          })
        } else if (isProjectResourceTarget(invite.resource)) {
          workspace = await deps.getProjectWorkspace({
            projectId: invite.resource.resourceId
          })
        }

        if (workspace) {
          await publish(WorkspaceSubscriptions.WorkspaceUpdated, {
            workspaceUpdated: {
              workspace,
              id: workspace.id
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
      getWorkspace,
      getProjectWorkspace: getProjectWorkspaceFactory({ db })
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
            getWorkspaceRoleToDefaultProjectRoleMappingFactory(),
          getWorkspaceSeatTypeToProjectRoleMapping:
            getWorkspaceSeatTypeToProjectRoleMappingFactory(),
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
      eventBus.listen(ServerInvitesEvents.Finalized, async ({ payload }) => {
        const onInviteFinalized = onInviteFinalizedFactory({
          getStream: getStreamFactory({ db }),
          logger: moduleLogger,
          updateWorkspaceRole: addOrUpdateWorkspaceRoleFactory({
            getWorkspaceWithDomains: getWorkspaceWithDomainsFactory({ db }),
            findVerifiedEmailsByUserId: findVerifiedEmailsByUserIdFactory({ db }),
            getWorkspaceRoles: getWorkspaceRolesFactory({ db }),
            upsertWorkspaceRole: upsertWorkspaceRoleFactory({ db }),
            emitWorkspaceEvent: (...args) => getEventBus().emit(...args),
            ensureValidWorkspaceRoleSeat
          }),
          getWorkspaceRole: getWorkspaceRoleForUserFactory({ db }),
          upsertProjectRole: upsertProjectRoleFactory({ db })
        })
        await onInviteFinalized(payload)
      }),
      eventBus.listen('workspace.*', async (payload) => {
        await workspaceTrackingFactory({
          countWorkspaceRole: countWorkspaceRoleWithOptionalProjectRoleFactory({ db }),
          getDefaultRegion: getDefaultRegionFactory({ db }),
          findPrimaryEmailForUser: findPrimaryEmailForUserFactory({ db }),
          getUserEmails: findEmailsByUserIdFactory({ db }),
          getWorkspace: getWorkspaceFactory({ db }),
          getWorkspacePlan,
          getWorkspaceSubscription: getWorkspaceSubscriptionFactory({ db }),
          getWorkspaceModelCount: getWorkspaceModelCountFactory({
            queryAllWorkspaceProjects: queryAllWorkspaceProjectsFactory({
              getStreams
            }),
            getPaginatedProjectModelsTotalCount:
              getPaginatedProjectModelsTotalCountFactory({ db })
          }),
          getWorkspacesProjectCount: getWorkspacesProjectsCountsFactory({ db }),
          getWorkspaceSeatCount: getWorkspaceSeatCountFactory({ db })
        })(payload)
      }),
      eventBus.listen('gatekeeper.*', async (payload) => {
        await workspaceTrackingFactory({
          countWorkspaceRole: countWorkspaceRoleWithOptionalProjectRoleFactory({ db }),
          getDefaultRegion: getDefaultRegionFactory({ db }),
          findPrimaryEmailForUser: findPrimaryEmailForUserFactory({ db }),
          getUserEmails: findEmailsByUserIdFactory({ db }),
          getWorkspace: getWorkspaceFactory({ db }),
          getWorkspacePlan,
          getWorkspaceSubscription: getWorkspaceSubscriptionFactory({ db }),
          getWorkspaceModelCount: getWorkspaceModelCountFactory({
            queryAllWorkspaceProjects: queryAllWorkspaceProjectsFactory({
              getStreams
            }),
            getPaginatedProjectModelsTotalCount:
              getPaginatedProjectModelsTotalCountFactory({ db })
          }),
          getWorkspacesProjectCount: getWorkspacesProjectsCountsFactory({ db }),
          getWorkspaceSeatCount: getWorkspaceSeatCountFactory({ db })
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
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      }),
      eventBus.listen(WorkspaceEvents.RoleDeleted, async ({ payload }) => {
        await withTransaction(
          async ({ db: trx }) => {
            const onWorkspaceRoleDeleted = onWorkspaceRoleDeletedFactory({
              queryAllWorkspaceProjects: queryAllWorkspaceProjectsFactory({
                getStreams
              }),
              deleteWorkspaceSeat: deleteWorkspaceSeatFactory({ db: trx }),
              getStreamsCollaboratorCounts: getStreamsCollaboratorCountsFactory({ db }),
              getWorkspaceCollaborators: getWorkspaceCollaboratorsFactory({ db }),
              setStreamCollaborator: setStreamCollaboratorFactory({
                getUser: getUserFactory({ db }),
                validateStreamAccess: validateStreamAccessFactory({
                  authorizeResolver
                }),
                emitEvent: eventBus.emit,
                grantStreamPermissions: grantStreamPermissionsFactory({
                  db: trx
                }),
                isStreamCollaborator: isStreamCollaboratorFactory({
                  getStream: getStreamFactory({ db })
                }),
                revokeStreamPermissions: revokeStreamPermissionsFactory({
                  db: trx
                })
              })
            })

            return await onWorkspaceRoleDeleted(payload)
          },
          { db }
        )
      }),
      eventBus.listen(WorkspaceEvents.RoleUpdated, async ({ payload }) => {
        await withTransaction(
          async ({ db: trx }) => {
            const onWorkspaceRoleUpdated = onWorkspaceRoleUpdatedFactory({
              queryAllWorkspaceProjects: queryAllWorkspaceProjectsFactory({
                getStreams
              }),
              setStreamCollaborator: setStreamCollaboratorFactory({
                getUser: getUserFactory({ db }),
                validateStreamAccess: validateStreamAccessFactory({
                  authorizeResolver
                }),
                emitEvent: eventBus.emit,
                grantStreamPermissions: grantStreamPermissionsFactory({
                  db: trx
                }),
                isStreamCollaborator: isStreamCollaboratorFactory({
                  getStream: getStreamFactory({ db })
                }),
                revokeStreamPermissions: revokeStreamPermissionsFactory({
                  db: trx
                })
              }),
              getWorkspaceUserSeat: getWorkspaceUserSeatFactory({ db }),
              getStreamsCollaboratorCounts: getStreamsCollaboratorCountsFactory({ db }),
              getWorkspaceCollaborators: getWorkspaceCollaboratorsFactory({ db }),
              getWorkspaceWithPlan: getWorkspaceWithPlanFactory({ db })
            })
            return await onWorkspaceRoleUpdated(payload)
          },
          { db }
        )
      }),
      eventBus.listen(WorkspaceEvents.SeatUpdated, async (payload) => {
        await withTransaction(
          async ({ db: trx }) => {
            const onWorkspaceSeatUpdated = onWorkspaceSeatUpdatedFactory({
              setStreamCollaborator: setStreamCollaboratorFactory({
                getUser: getUserFactory({ db }),
                validateStreamAccess: validateStreamAccessFactory({
                  authorizeResolver
                }),
                emitEvent: eventBus.emit,
                grantStreamPermissions: grantStreamPermissionsFactory({ db: trx }),
                isStreamCollaborator: isStreamCollaboratorFactory({
                  getStream: getStreamFactory({ db })
                }),
                revokeStreamPermissions: revokeStreamPermissionsFactory({ db: trx })
              }),
              queryAllWorkspaceProjects: queryAllWorkspaceProjectsFactory({
                getStreams
              }),
              getWorkspaceWithPlan: getWorkspaceWithPlanFactory({ db }),
              getWorkspaceRoleForUser: getWorkspaceRoleForUserFactory({ db }),
              getWorkspaceSeatTypeToProjectRoleMapping:
                getWorkspaceSeatTypeToProjectRoleMappingFactory(),
              getStreamsCollaboratorCounts: getStreamsCollaboratorCountsFactory({ db }),
              getWorkspaceCollaborators: getWorkspaceCollaboratorsFactory({ db })
            })

            return await onWorkspaceSeatUpdated(payload)
          },
          { db }
        )
      }),
      eventBus.listen('**', emitWorkspaceGraphqlSubscriptions),
      eventBus.listen(
        ProjectEvents.PermissionsBeingAdded,
        blockInvalidWorkspaceProjectRoleUpdates
      )
    ]

    return () => quitCbs.forEach((quit) => quit())
  }
