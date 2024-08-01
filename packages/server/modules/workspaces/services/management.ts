import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'
import {
  EmitWorkspaceEvent,
  GetWorkspace,
  StoreBlob,
  UpsertWorkspace,
  UpsertWorkspaceRole
} from '@/modules/workspaces/domain/operations'
import { Workspace, WorkspaceAcl } from '@/modules/workspacesCore/domain/types'
import { MaybeNullOrUndefined, Roles } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
import {
  grantStreamPermissions as repoGrantStreamPermissions,
  revokeStreamPermissions as repoRevokeStreamPermissions
} from '@/modules/core/repositories/streams'
import { getStreams as serviceGetStreams } from '@/modules/core/services/streams'
import {
  DeleteWorkspaceRole,
  GetWorkspaceRoleForUser,
  GetWorkspaceRoles
} from '@/modules/workspaces/domain/operations'
import {
  WorkspaceAdminRequiredError,
  WorkspaceNotFoundError
} from '@/modules/workspaces/errors/workspace'
import {
  isUserLastWorkspaceAdmin,
  mapWorkspaceRoleToProjectRole
} from '@/modules/workspaces/helpers/roles'
import { queryAllWorkspaceProjectsFactory } from '@/modules/workspaces/services/projects'
import { EventBus } from '@/modules/shared/services/eventBus'
import { removeNullOrUndefinedKeys } from '@speckle/shared'
import { authorizeResolver } from '@/modules/shared'
import { isNewResourceAllowed } from '@/modules/core/helpers/token'
import {
  TokenResourceIdentifier,
  TokenResourceIdentifierType
} from '@/modules/core/domain/tokens/types'
import { ForbiddenError } from '@/modules/shared/errors'

const tryStoreBlobFactory =
  (storeBlob: StoreBlob) =>
  async (blob?: string | null): Promise<string | null> => {
    let logoUrl: string | null = null
    if (blob) {
      logoUrl = await storeBlob(blob)
    }
    return logoUrl
  }

type WorkspaceCreateArgs = {
  userId: string
  workspaceInput: {
    name: string
    description: string | null
    logoUrl: string | null
  }
  userResourceAccessLimits: MaybeNullOrUndefined<TokenResourceIdentifier[]>
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
    emitWorkspaceEvent: EventBus['emit']
    storeBlob: StoreBlob
  }) =>
  async ({
    userId,
    workspaceInput,
    userResourceAccessLimits
  }: WorkspaceCreateArgs): Promise<Workspace> => {
    if (
      !isNewResourceAllowed({
        resourceType: TokenResourceIdentifierType.Workspace,
        resourceAccessRules: userResourceAccessLimits
      })
    ) {
      throw new ForbiddenError('You are not authorized to create a workspace')
    }

    const logoUrl = await tryStoreBlobFactory(storeBlob)(workspaceInput.logoUrl)

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

type WorkspaceUpdateArgs = {
  /** Id of user performing the operation */
  workspaceUpdaterId: string
  workspaceId: string
  workspaceInput: {
    name?: string | null
    description?: string | null
    logoUrl?: string | null
  }
  updaterResourceAccessLimits: MaybeNullOrUndefined<TokenResourceIdentifier[]>
}

export const updateWorkspaceFactory =
  ({
    getWorkspace,
    upsertWorkspace,
    emitWorkspaceEvent,
    storeBlob
  }: {
    getWorkspace: GetWorkspace
    upsertWorkspace: UpsertWorkspace
    emitWorkspaceEvent: EventBus['emit']
    storeBlob: StoreBlob
  }) =>
  async ({
    workspaceUpdaterId,
    workspaceId,
    workspaceInput,
    updaterResourceAccessLimits
  }: WorkspaceUpdateArgs): Promise<Workspace> => {
    await authorizeResolver(
      workspaceUpdaterId,
      workspaceId,
      Roles.Workspace.Admin,
      updaterResourceAccessLimits
    )

    const currentWorkspace = await getWorkspace({ workspaceId })

    if (!currentWorkspace) {
      throw new WorkspaceNotFoundError()
    }

    const logoUrl = await tryStoreBlobFactory(storeBlob)(workspaceInput.logoUrl)

    const workspace = {
      ...currentWorkspace,
      ...removeNullOrUndefinedKeys(workspaceInput),
      updatedAt: new Date(),
      logoUrl
    }

    await upsertWorkspace({ workspace })
    await emitWorkspaceEvent({ eventName: WorkspaceEvents.Updated, payload: workspace })

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
    getStreams: typeof serviceGetStreams
    revokeStreamPermissions: typeof repoRevokeStreamPermissions
  }) =>
  async ({
    workspaceId,
    userId
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

export const updateWorkspaceRoleFactory =
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
    getStreams: typeof serviceGetStreams
    grantStreamPermissions: typeof repoGrantStreamPermissions
  }) =>
  async ({ workspaceId, userId, role }: WorkspaceAcl): Promise<void> => {
    // Protect against removing last admin
    const workspaceRoles = await getWorkspaceRoles({ workspaceId })
    if (
      isUserLastWorkspaceAdmin(workspaceRoles, userId) &&
      role !== Roles.Workspace.Admin
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
