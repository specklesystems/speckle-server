import { grantStreamPermissions } from '@/modules/core/repositories/streams'
import {
  DeleteWorkspaceRole,
  EmitWorkspaceEvent,
  GetWorkspaceProjects,
  GetWorkspaceRole,
  UpsertWorkspaceRole
} from '@/modules/workspaces/domain/operations'
import { WorkspaceAcl } from '@/modules/workspaces/domain/types'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import { StreamRoles, WorkspaceRoles } from '@speckle/shared'

type WorkspaceRoleDeleteArgs = {
  userId: string
  workspaceId: string
}

export const deleteWorkspaceRoleFactory =
  ({
    deleteWorkspaceRole,
    emitWorkspaceEvent
  }: {
    deleteWorkspaceRole: DeleteWorkspaceRole
    emitWorkspaceEvent: EmitWorkspaceEvent
  }) =>
  async ({
    userId,
    workspaceId
  }: WorkspaceRoleDeleteArgs): Promise<WorkspaceAcl | null> => {
    const deletedRole = await deleteWorkspaceRole({ userId, workspaceId })

    if (!!deletedRole) {
      emitWorkspaceEvent({ event: WorkspaceEvents.RoleDeleted, payload: deletedRole })
    }

    return deletedRole
  }

type WorkspaceRoleGetArgs = {
  userId: string
  workspaceId: string
}

export const getWorkspaceRoleFactory =
  ({ getWorkspaceRole }: { getWorkspaceRole: GetWorkspaceRole }) =>
  async ({
    userId,
    workspaceId
  }: WorkspaceRoleGetArgs): Promise<WorkspaceAcl | null> => {
    return await getWorkspaceRole({ userId, workspaceId })
  }

/**
 * Given the workspace role being assigned to a user, return the role we should grant the user
 * for all projects in the workspace.
 */
const mapWorkspaceRoleToDefaultProjectRole = (
  workspaceRole: WorkspaceRoles
): StreamRoles => {
  switch (workspaceRole) {
    case 'workspace:guest':
    case 'workspace:member':
      return 'stream:reviewer'
    case 'workspace:admin':
      return 'stream:owner'
  }
}

export const setWorkspaceRoleFactory =
  ({
    getWorkspaceProjects,
    upsertWorkspaceRole,
    emitWorkspaceEvent
  }: {
    getWorkspaceProjects: GetWorkspaceProjects
    upsertWorkspaceRole: UpsertWorkspaceRole
    emitWorkspaceEvent: EmitWorkspaceEvent
  }) =>
  async ({ userId, workspaceId, role }: WorkspaceAcl): Promise<void> => {
    await upsertWorkspaceRole({ userId, workspaceId, role })

    // Update user role on workspace projects
    // TODO: How to handle demotions, if a user was previously granted contributor/owner?
    const projectRole = mapWorkspaceRoleToDefaultProjectRole(role)

    const workspaceProjects = await getWorkspaceProjects({ workspaceId })

    await Promise.all(
      workspaceProjects.map(({ id }) =>
        grantStreamPermissions({ streamId: id, userId, role: projectRole })
      )
    )

    // TODO: Should we return the final record from `upsert`, or `get`, instead of emitting args directly?
    await emitWorkspaceEvent({
      event: WorkspaceEvents.RoleUpdated,
      payload: { userId, workspaceId, role }
    })
  }
