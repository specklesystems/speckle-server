import {
  ProjectsEmitter,
  ProjectEvents,
  ProjectEventsPayloads
} from '@/modules/core/events/projectsEmitter'
import {
  deleteProjectRoleFactory,
  getStreamFactory,
  legacyGetStreamsFactory,
  upsertProjectRoleFactory
} from '@/modules/core/repositories/streams'
import {
  GetWorkspace,
  GetWorkspaceRoleForUser,
  GetWorkspaceRoles,
  GetWorkspaceRoleToDefaultProjectRoleMapping,
  QueryAllWorkspaceProjects
} from '@/modules/workspaces/domain/operations'
import {
  ServerInvitesEvents,
  ServerInvitesEventsPayloads
} from '@/modules/serverinvites/domain/events'
import {
  isProjectResourceTarget,
  resolveTarget
} from '@/modules/serverinvites/helpers/core'
import { logger, moduleLogger } from '@/logging/logging'
import { updateWorkspaceRoleFactory } from '@/modules/workspaces/services/management'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { WorkspaceInviteResourceType } from '@/modules/workspaces/domain/constants'
import { Roles, WorkspaceRoles } from '@speckle/shared'
import {
  DeleteProjectRole,
  UpsertProjectRole
} from '@/modules/core/domain/projects/operations'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import { Knex } from 'knex'
import {
  getWorkspaceFactory,
  getWorkspaceRoleForUserFactory,
  getWorkspaceRolesFactory,
  getWorkspaceWithDomainsFactory,
  upsertWorkspaceRoleFactory
} from '@/modules/workspaces/repositories/workspaces'
import {
  queryAllWorkspaceProjectsFactory,
  getWorkspaceRoleToDefaultProjectRoleMappingFactory
} from '@/modules/workspaces/services/projects'
import { withTransaction } from '@/modules/shared/helpers/dbHelper'
import { findVerifiedEmailsByUserIdFactory } from '@/modules/core/repositories/userEmails'
import { GetStream } from '@/modules/core/domain/streams/operations'
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

export const onProjectCreatedFactory =
  ({
    getWorkspaceRoles,
    upsertProjectRole,
    getWorkspaceRoleToDefaultProjectRoleMapping
  }: {
    getWorkspaceRoles: GetWorkspaceRoles
    upsertProjectRole: UpsertProjectRole
    getWorkspaceRoleToDefaultProjectRoleMapping: GetWorkspaceRoleToDefaultProjectRoleMapping
  }) =>
  async (payload: ProjectEventsPayloads[typeof ProjectEvents.Created]) => {
    const { id: projectId, workspaceId } = payload.project

    if (!workspaceId) {
      return
    }

    const workspaceMembers = await getWorkspaceRoles({ workspaceId })

    const defaultRoleMapping = await getWorkspaceRoleToDefaultProjectRoleMapping({
      workspaceId
    })

    await Promise.all(
      workspaceMembers.map(({ userId, role: workspaceRole }) => {
        const projectRole = defaultRoleMapping[workspaceRole]

        // we do not need to assign new roles to the project owner
        if (userId === payload.ownerId) return
        // Guests do not get roles on project create
        if (!projectRole || workspaceRole === Roles.Workspace.Guest) return

        return upsertProjectRole({
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
      skipProjectRoleUpdatesFor: [project.id]
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
    if (workspaceRole?.role === Roles.Workspace.Guest) return

    const provider = await getWorkspaceSsoProviderRecord({ workspaceId })
    if (!provider) return

    const session = await getUserSsoSession({ userId, workspaceId })
    if (!session || !isValidSsoSession(session)) {
      const workspace = await getWorkspace({ workspaceId })
      throw new SsoSessionMissingOrExpiredError(workspace?.slug)
    }
  }

export const onWorkspaceRoleDeletedFactory =
  ({
    queryAllWorkspaceProjects,
    deleteProjectRole
  }: {
    queryAllWorkspaceProjects: QueryAllWorkspaceProjects
    deleteProjectRole: DeleteProjectRole
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
  }

export const onWorkspaceRoleUpdatedFactory =
  ({
    getWorkspaceRoleToDefaultProjectRoleMapping,
    queryAllWorkspaceProjects,
    deleteProjectRole,
    upsertProjectRole
  }: {
    getWorkspaceRoleToDefaultProjectRoleMapping: GetWorkspaceRoleToDefaultProjectRoleMapping
    queryAllWorkspaceProjects: QueryAllWorkspaceProjects
    deleteProjectRole: DeleteProjectRole
    upsertProjectRole: UpsertProjectRole
  }) =>
  async ({
    userId,
    role,
    workspaceId,
    flags
  }: {
    userId: string
    role: WorkspaceRoles
    workspaceId: string
    flags?: {
      skipProjectRoleUpdatesFor: string[]
    }
  }) => {
    const defaultProjectRoleMapping = await getWorkspaceRoleToDefaultProjectRoleMapping(
      {
        workspaceId
      }
    )

    const nextProjectRole = defaultProjectRoleMapping[role]

    for await (const projectsPage of queryAllWorkspaceProjects({ workspaceId })) {
      await Promise.all(
        projectsPage.map(async ({ id: projectId }) => {
          if (flags?.skipProjectRoleUpdatesFor.includes(projectId)) {
            // Skip assignment (used during invite flow)
            // TODO: Can we refactor this special case away?
            return
          }

          if (!nextProjectRole) {
            // User is being demoted to a workspace role without project access
            await deleteProjectRole({ projectId, userId })
            return
          }

          await upsertProjectRole(
            {
              projectId,
              userId,
              role: nextProjectRole
            },
            { trackProjectUpdate: false }
          )
        })
      )
    }
  }

export const initializeEventListenersFactory =
  ({ db }: { db: Knex }) =>
  () => {
    const eventBus = getEventBus()
    const getStreams = legacyGetStreamsFactory({ db })
    const quitCbs = [
      ProjectsEmitter.listen(ProjectEvents.Created, async (payload) => {
        const onProjectCreated = onProjectCreatedFactory({
          getWorkspaceRoleToDefaultProjectRoleMapping:
            getWorkspaceRoleToDefaultProjectRoleMappingFactory({
              getWorkspace: getWorkspaceFactory({ db })
            }),
          upsertProjectRole: upsertProjectRoleFactory({ db }),
          getWorkspaceRoles: getWorkspaceRolesFactory({ db })
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
            emitWorkspaceEvent: (...args) => getEventBus().emit(...args)
          })
        })
        await onInviteFinalized(payload)
      }),
      eventBus.listen(WorkspaceEvents.Authorized, async ({ payload }) => {
        const onWorkspaceAuthorized = onWorkspaceAuthorizedFactory({
          getWorkspace: getWorkspaceFactory({ db }),
          getWorkspaceRoleForUser: getWorkspaceRoleForUserFactory({ db }),
          getWorkspaceSsoProviderRecord: getWorkspaceSsoProviderRecordFactory({ db }),
          getUserSsoSession: getUserSsoSessionFactory({ db })
        })
        await onWorkspaceAuthorized(payload)
      }),
      eventBus.listen(WorkspaceEvents.RoleDeleted, async ({ payload }) => {
        const trx = await db.transaction()
        const onWorkspaceRoleDeleted = onWorkspaceRoleDeletedFactory({
          queryAllWorkspaceProjects: queryAllWorkspaceProjectsFactory({ getStreams }),
          deleteProjectRole: deleteProjectRoleFactory({ db: trx })
        })
        await withTransaction(onWorkspaceRoleDeleted(payload), trx)
      }),
      eventBus.listen(WorkspaceEvents.RoleUpdated, async ({ payload }) => {
        const trx = await db.transaction()
        const onWorkspaceRoleUpdated = onWorkspaceRoleUpdatedFactory({
          getWorkspaceRoleToDefaultProjectRoleMapping:
            getWorkspaceRoleToDefaultProjectRoleMappingFactory({
              getWorkspace: getWorkspaceFactory({ db: trx })
            }),
          queryAllWorkspaceProjects: queryAllWorkspaceProjectsFactory({ getStreams }),
          deleteProjectRole: deleteProjectRoleFactory({ db: trx }),
          upsertProjectRole: upsertProjectRoleFactory({ db: trx })
        })
        await withTransaction(onWorkspaceRoleUpdated(payload), trx)
      })
    ]

    return () => quitCbs.forEach((quit) => quit())
  }
