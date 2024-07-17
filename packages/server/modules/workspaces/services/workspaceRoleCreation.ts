import {
  DeleteWorkspaceRole,
  EmitWorkspaceEvent,
  GetWorkspaceRoleForUser,
  GetWorkspaceRoles,
  UpsertWorkspaceRole
} from '@/modules/workspaces/domain/operations'
import { WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import { WorkspaceAdminRequiredError } from '@/modules/workspaces/errors/workspace'
import { isUserLastWorkspaceAdmin } from '@/modules/workspaces/utils/isUserLastWorkspaceAdmin'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'

type WorkspaceRoleDeleteArgs = {
  userId: string
  workspaceId: string
}

export const deleteWorkspaceRoleFactory =
  ({
    getWorkspaceRoles,
    deleteWorkspaceRole,
    emitWorkspaceEvent
  }: {
    getWorkspaceRoles: GetWorkspaceRoles
    deleteWorkspaceRole: DeleteWorkspaceRole
    emitWorkspaceEvent: EmitWorkspaceEvent
  }) =>
  async ({
    userId,
    workspaceId
  }: WorkspaceRoleDeleteArgs): Promise<WorkspaceAcl | null> => {
    const workspaceRoles = await getWorkspaceRoles({ workspaceId })

    if (isUserLastWorkspaceAdmin(workspaceRoles, userId)) {
      throw new WorkspaceAdminRequiredError()
    }

    const deletedRole = await deleteWorkspaceRole({ userId, workspaceId })

    if (!deletedRole) {
      return null
    }

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
    emitWorkspaceEvent
  }: {
    getWorkspaceRoles: GetWorkspaceRoles
    upsertWorkspaceRole: UpsertWorkspaceRole
    emitWorkspaceEvent: EmitWorkspaceEvent
  }) =>
  async ({ userId, workspaceId, role }: WorkspaceAcl): Promise<void> => {
    const workspaceRoles = await getWorkspaceRoles({ workspaceId })

    if (
      isUserLastWorkspaceAdmin(workspaceRoles, userId) &&
      role !== 'workspace:admin'
    ) {
      throw new WorkspaceAdminRequiredError()
    }

    await upsertWorkspaceRole({ userId, workspaceId, role })

    await emitWorkspaceEvent({
      eventName: WorkspaceEvents.RoleUpdated,
      payload: { userId, workspaceId, role }
    })
  }
