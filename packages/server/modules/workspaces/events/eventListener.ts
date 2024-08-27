import {
  ProjectsEmitter,
  ProjectEvents,
  ProjectEventsPayloads
} from '@/modules/core/events/projectsEmitter'
import {
  getStream,
  grantStreamPermissions as repoGrantStreamPermissions
} from '@/modules/core/repositories/streams'
import { GetWorkspaceRoles } from '@/modules/workspaces/domain/operations'
import { mapWorkspaceRoleToInitialProjectRole } from '@/modules/workspaces/helpers/roles'
import {
  ServerInvitesEvents,
  ServerInvitesEventsPayloads
} from '@/modules/serverinvites/domain/events'
import {
  isProjectResourceTarget,
  resolveTarget
} from '@/modules/serverinvites/helpers/core'
import { logger } from '@/logging/logging'
import { updateWorkspaceRoleFactory } from '@/modules/workspaces/services/management'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { WorkspaceInviteResourceType } from '@/modules/workspaces/domain/constants'
import { Roles } from '@speckle/shared'

export const onProjectCreatedFactory =
  ({
    getWorkspaceRoles,
    grantStreamPermissions
  }: {
    getWorkspaceRoles: GetWorkspaceRoles
    grantStreamPermissions: typeof repoGrantStreamPermissions
  }) =>
    async (payload: ProjectEventsPayloads[typeof ProjectEvents.Created]) => {
      const { id: projectId, workspaceId } = payload.project

      if (!workspaceId) {
        return
      }

      const workspaceMembers = await getWorkspaceRoles({ workspaceId })

      await Promise.all(
        workspaceMembers.map(({ userId, role: workspaceRole }) => {
          const projectRole = mapWorkspaceRoleToInitialProjectRole(workspaceRole)

          // Guests do not get roles on project create
          if (!projectRole || workspaceRole === Roles.Workspace.Guest) return

          return grantStreamPermissions({
            streamId: projectId,
            userId,
            role: projectRole
          })
        })
      )
    }

export const onInviteFinalizedFactory =
  (deps: {
    getStream: typeof getStream
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
          `When handling accepted invite - project not found or useris not a collaborator`,
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

export const initializeEventListenersFactory =
  (
    deps: Parameters<typeof onProjectCreatedFactory>[0] &
      Parameters<typeof onInviteFinalizedFactory>[0]
  ) =>
    () => {
      const onProjectCreated = onProjectCreatedFactory(deps)
      const onInviteFinalized = onInviteFinalizedFactory(deps)

      const quitCbs = [
        ProjectsEmitter.listen(ProjectEvents.Created, onProjectCreated),
        getEventBus().listen(ServerInvitesEvents.Finalized, ({ payload }) =>
          onInviteFinalized(payload)
        )
      ]

      return () => quitCbs.forEach((quit) => quit())
    }
