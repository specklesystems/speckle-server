import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import {
  EmitWorkspaceEvent,
  StoreBlob,
  UpsertWorkspace,
  UpsertWorkspaceRole
} from '@/modules/workspaces/domain/operations'
import { Workspace, WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import { Roles } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
import {
  grantStreamPermissions as repoGrantStreamPermissions,
  revokeStreamPermissions as repoRevokeStreamPermissions
} from '@/modules/core/repositories/streams'
import { getStreams as repoGetStreams } from '@/modules/core/services/streams'
import {
  DeleteWorkspaceRole,
  GetWorkspaceRoleForUser,
  GetWorkspaceRoles
} from '@/modules/workspaces/domain/operations'
import { WorkspaceAdminRequiredError } from '@/modules/workspaces/errors/workspace'
import { isUserLastWorkspaceAdmin } from '@/modules/workspaces/utils/roles'
import { mapWorkspaceRoleToProjectRole } from '@/modules/workspaces/domain/roles'
import { queryAllWorkspaceProjectsFactory } from '@/modules/workspaces/services/projects'

type WorkspaceCreateArgs = {
  workspaceInput: { name: string; description: string | null; logo: string | null }
  userId: string
}

export const createWorkspaceFactory =
  ({
    upsertWorkspace,
    upsertWorkspaceRole,
    emitWorkspaceEvent,
    storeBlob
  }: {
    upsertWorkspace: UpsertWorkspace
    upsertWorkspaceRole: UpsertWorkspaceRole
    storeBlob: StoreBlob
    emitWorkspaceEvent: EmitWorkspaceEvent
  }) =>
  async ({ userId, workspaceInput }: WorkspaceCreateArgs): Promise<Workspace> => {
    let logoUrl: string | null = null
    if (workspaceInput.logo) {
      logoUrl = await storeBlob(workspaceInput.logo)
    }

    const workspace = {
      ...workspaceInput,
      id: cryptoRandomString({ length: 10 }),
      createdAt: new Date(),
      updatedAt: new Date(),
      logoUrl
    }
    await upsertWorkspace({ workspace })
    // assign the creator as workspace administrator
    await upsertWorkspaceRole({
      userId,
      role: Roles.Workspace.Admin,
      workspaceId: workspace.id
    })

    // emit a workspace created event
    await emitWorkspaceEvent({
      eventName: WorkspaceEvents.Created,
      payload: { ...workspace, createdByUserId: userId }
    })

    return workspace
  }

type WorkspaceRoleDeleteArgs = {
  userId: string
  workspaceId: string
}

export const deleteWorkspaceRoleFactory =
  ({
    getWorkspaceRoles,
    deleteWorkspaceRole,
    emitWorkspaceEvent,
    getStreams,
    revokeStreamPermissions
  }: {
    getWorkspaceRoles: GetWorkspaceRoles
    deleteWorkspaceRole: DeleteWorkspaceRole
    emitWorkspaceEvent: EmitWorkspaceEvent
    getStreams: typeof repoGetStreams
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
    const queryAllWorkspaceProjectsGenerator = queryAllWorkspaceProjectsFactory({
      getStreams
    })
    for await (const projectsPage of queryAllWorkspaceProjectsGenerator(workspaceId)) {
      await Promise.all(
        projectsPage.map(({ id: streamId }) =>
          revokeStreamPermissions({ streamId, userId })
        )
      )
    }

    // Emit deleted role
    await emitWorkspaceEvent({
      eventName: WorkspaceEvents.RoleDeleted,
      payload: deletedRole
    })

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
    getStreams,
    grantStreamPermissions
  }: {
    getWorkspaceRoles: GetWorkspaceRoles
    upsertWorkspaceRole: UpsertWorkspaceRole
    emitWorkspaceEvent: EmitWorkspaceEvent
    // TODO: Create `core` domain and import type from there
    getStreams: typeof repoGetStreams
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
    const queryAllWorkspaceProjectsGenerator = queryAllWorkspaceProjectsFactory({
      getStreams
    })
    const projectRole = mapWorkspaceRoleToProjectRole(role)
    for await (const projectsPage of queryAllWorkspaceProjectsGenerator(workspaceId)) {
      await Promise.all(
        projectsPage.map(({ id: streamId }) =>
          grantStreamPermissions({ streamId, userId, role: projectRole })
        )
      )
    }

    // Emit new role
    await emitWorkspaceEvent({
      eventName: WorkspaceEvents.RoleUpdated,
      payload: { userId, workspaceId, role }
    })
  }
