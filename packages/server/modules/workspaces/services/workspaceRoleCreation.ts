import {
  DeleteWorkspaceRole,
  EmitWorkspaceEvent,
  GetWorkspaceRole,
  UpsertWorkspaceRole
} from '@/modules/workspaces/domain/operations'
import { WorkspaceAcl } from '@/modules/workspaces/domain/types'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'

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

export const setWorkspaceRoleFactory =
  ({
    upsertWorkspaceRole,
    emitWorkspaceEvent
  }: {
    upsertWorkspaceRole: UpsertWorkspaceRole
    emitWorkspaceEvent: EmitWorkspaceEvent
  }) =>
  async ({ userId, workspaceId, role }: WorkspaceAcl): Promise<void> => {
    await upsertWorkspaceRole({ userId, workspaceId, role })

    // TODO: Should we return the final record from `upsert`, or `get`, instead of emitting args directly?
    await emitWorkspaceEvent({
      event: WorkspaceEvents.RoleUpdated,
      payload: { userId, workspaceId, role }
    })
  }
