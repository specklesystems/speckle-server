import {
  getUserStreams as repoGetUserStreams,
  grantStreamPermissions as repoGrantStreamPermissions,
  revokeStreamPermissions as repoRevokeStreamPermissions
} from '@/modules/core/repositories/streams'
import {
  DeleteWorkspaceRole,
  EmitWorkspaceEvent,
  GetWorkspaceRoleForUser,
  GetWorkspaceRoles,
  UpsertWorkspaceRole
} from '@/modules/workspaces/domain/operations'
import { WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import { WorkspaceAdminRequiredError } from '@/modules/workspaces/errors/workspace'
import { getAllWorkspaceProjectsForUserFactory } from '@/modules/workspaces/services/workspaceProjects'
import { isUserLastWorkspaceAdmin } from '@/modules/workspaces/utils/roles'
import { mapWorkspaceRoleToProjectRole } from '@/modules/workspaces/domain/roles'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'

type WorkspaceRoleDeleteArgs = {
  userId: string
  workspaceId: string
}

export const deleteWorkspaceRoleFactory =
  ({
    getWorkspaceRoles,
    deleteWorkspaceRole,
    emitWorkspaceEvent,
    getUserStreams,
    revokeStreamPermissions
  }: {
    getWorkspaceRoles: GetWorkspaceRoles
    deleteWorkspaceRole: DeleteWorkspaceRole
    emitWorkspaceEvent: EmitWorkspaceEvent
    getUserStreams: typeof repoGetUserStreams
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
    const workspaceProjects = await getAllWorkspaceProjectsForUserFactory({
      getUserStreams
    })({ userId, workspaceId })

    await Promise.all(
      workspaceProjects.map(({ id: streamId }) =>
        revokeStreamPermissions({ streamId, userId })
      )
    )

    // Emit deleted role
    emitWorkspaceEvent({ eventName: WorkspaceEvents.RoleDeleted, payload: deletedRole })

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
    getWorkspaceRoles,
    upsertWorkspaceRole,
    emitWorkspaceEvent,
    getUserStreams,
    grantStreamPermissions
  }: {
    getWorkspaceRoles: GetWorkspaceRoles
    upsertWorkspaceRole: UpsertWorkspaceRole
    emitWorkspaceEvent: EmitWorkspaceEvent
    // TODO: Create `core` domain and import type from there
    getUserStreams: typeof repoGetUserStreams
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
    const workspaceProjects = await getAllWorkspaceProjectsForUserFactory({
      getUserStreams
    })({ userId, workspaceId })
    await Promise.all(
      workspaceProjects.map(({ id: streamId }) =>
        grantStreamPermissions({ streamId, userId, role: projectRole })
      )
    )

    // Emit new role
    await emitWorkspaceEvent({
      eventName: WorkspaceEvents.RoleUpdated,
      payload: { userId, workspaceId, role }
    })
  }
