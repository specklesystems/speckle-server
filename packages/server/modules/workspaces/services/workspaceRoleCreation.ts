import {
  grantStreamPermissions as repoGrantStreamPermissions,
  revokeStreamPermissions as repoRevokeStreamPermissions
} from '@/modules/core/repositories/streams'
import {
  DeleteWorkspaceRole,
  EmitWorkspaceEvent,
  GetWorkspaceProjects,
  GetWorkspaceRoleForUser,
  GetWorkspaceRoles,
  UpsertWorkspaceRole
} from '@/modules/workspaces/domain/operations'
import { WorkspaceAcl } from '@/modules/workspaces/domain/types'
import { WorkspaceAdminRequiredError } from '@/modules/workspaces/errors/workspace'
import { isUserLastWorkspaceAdmin } from '@/modules/workspaces/utils/isUserLastWorkspaceAdmin'
import { mapWorkspaceRoleToProjectRole } from '@/modules/workspaces/utils/mapWorkspaceRoleToProjectRole'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'

type WorkspaceRoleDeleteArgs = {
  userId: string
  workspaceId: string
}

export const deleteWorkspaceRoleFactory =
  ({
    getWorkspaceProjects,
    getWorkspaceRoles,
    deleteWorkspaceRole,
    emitWorkspaceEvent,
    revokeStreamPermissions
  }: {
    getWorkspaceProjects: GetWorkspaceProjects
    getWorkspaceRoles: GetWorkspaceRoles
    deleteWorkspaceRole: DeleteWorkspaceRole
    emitWorkspaceEvent: EmitWorkspaceEvent
    revokeStreamPermissions: typeof repoRevokeStreamPermissions
  }) =>
  async ({
    userId,
    workspaceId
  }: WorkspaceRoleDeleteArgs): Promise<WorkspaceAcl | null> => {
    // Protect against removing last admin
    const workspaceRoles = await getWorkspaceRoles({ workspaceId })
    if (isUserLastWorkspaceAdmin(workspaceRoles, userId)) {
      throw new WorkspaceAdminRequiredError()
    }

    // Perform delete
    const deletedRole = await deleteWorkspaceRole({ userId, workspaceId })
    if (!deletedRole) {
      return null
    }

    // Delete workspace project roles
    const workspaceProjects = await getWorkspaceProjects({ workspaceId })
    await Promise.all(
      workspaceProjects.map(({ id: streamId }) =>
        revokeStreamPermissions({ streamId, userId })
      )
    )

    // Emit deleted role
    emitWorkspaceEvent({ event: WorkspaceEvents.RoleDeleted, payload: deletedRole })

    return deletedRole
  }

type WorkspaceRoleGetArgs = {
  userId: string
  workspaceId: string
}

export const getWorkspaceRoleFactory =
  ({ getWorkspaceRoleForUser }: { getWorkspaceRoleForUser: GetWorkspaceRoleForUser }) =>
  async ({
    userId,
    workspaceId
  }: WorkspaceRoleGetArgs): Promise<WorkspaceAcl | null> => {
    return await getWorkspaceRoleForUser({ userId, workspaceId })
  }

export const setWorkspaceRoleFactory =
  ({
    getWorkspaceProjects,
    getWorkspaceRoles,
    upsertWorkspaceRole,
    emitWorkspaceEvent,
    grantStreamPermissions
  }: {
    getWorkspaceProjects: GetWorkspaceProjects
    getWorkspaceRoles: GetWorkspaceRoles
    upsertWorkspaceRole: UpsertWorkspaceRole
    emitWorkspaceEvent: EmitWorkspaceEvent
    // TODO: Create `core` domain and import type from there
    grantStreamPermissions: typeof repoGrantStreamPermissions
  }) =>
  async ({ userId, workspaceId, role }: WorkspaceAcl): Promise<void> => {
    // Protect against removing last admin
    const workspaceRoles = await getWorkspaceRoles({ workspaceId })
    if (
      isUserLastWorkspaceAdmin(workspaceRoles, userId) &&
      role !== 'workspace:admin'
    ) {
      throw new WorkspaceAdminRequiredError()
    }

    // Perform upsert
    await upsertWorkspaceRole({ userId, workspaceId, role })

    // Update user role in all workspace projects
    // TODO: Should these be in a transaction with the workspace role change?
    const projectRole = mapWorkspaceRoleToProjectRole(role)
    const workspaceProjects = await getWorkspaceProjects({ workspaceId })
    await Promise.all(
      workspaceProjects.map((project) =>
        grantStreamPermissions({ streamId: project.id, userId, role: projectRole })
      )
    )

    // Emit new role
    await emitWorkspaceEvent({
      event: WorkspaceEvents.RoleUpdated,
      payload: { userId, workspaceId, role }
    })
  }
