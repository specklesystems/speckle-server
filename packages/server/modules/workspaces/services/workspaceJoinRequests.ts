import {
  WorkspaceNotDiscoverableError,
  WorkspaceNotFoundError,
  WorkspaceNotJoinableError,
  WorkspaceProtectedError
} from '@/modules/workspaces/errors/workspace'
import type { GetUser } from '@/modules/core/domain/users/operations'
import { NotFoundError } from '@/modules/shared/errors'
import type {
  AddOrUpdateWorkspaceRole,
  ApproveWorkspaceJoinRequest,
  CreateWorkspaceJoinRequest,
  DenyWorkspaceJoinRequest,
  GetWorkspace,
  GetWorkspaceCollaborators,
  GetWorkspaceJoinRequest,
  GetWorkspaceWithDomains,
  SendWorkspaceJoinRequestApprovedEmail,
  SendWorkspaceJoinRequestDeniedEmail,
  SendWorkspaceJoinRequestReceivedEmail,
  UpdateWorkspaceJoinRequestStatus
} from '@/modules/workspaces/domain/operations'
import { Roles } from '@speckle/shared'
import type { FindEmailsByUserId } from '@/modules/core/domain/userEmails/operations'
import { userEmailsCompliantWithWorkspaceDomains } from '@/modules/workspaces/domain/logic'
import type { EventBus } from '@/modules/shared/services/eventBus'
import { WorkspaceEvents } from '@/modules/workspacesCore/domain/events'

export const dismissWorkspaceJoinRequestFactory =
  ({
    getWorkspace,
    updateWorkspaceJoinRequestStatus
  }: {
    getWorkspace: GetWorkspace
    updateWorkspaceJoinRequestStatus: UpdateWorkspaceJoinRequestStatus
  }) =>
  async ({ userId, workspaceId }: { userId: string; workspaceId: string }) => {
    const workspace = await getWorkspace({ workspaceId })
    if (!workspace) {
      throw new WorkspaceNotFoundError()
    }
    await updateWorkspaceJoinRequestStatus({
      userId,
      workspaceId,
      status: 'dismissed'
    })
    return true
  }

export const requestToJoinWorkspaceFactory =
  ({
    createWorkspaceJoinRequest,
    sendWorkspaceJoinRequestReceivedEmail,
    addOrUpdateWorkspaceRole,
    getUserById,
    getWorkspaceWithDomains,
    getWorkspaceTeam,
    getUserEmails
  }: {
    createWorkspaceJoinRequest: CreateWorkspaceJoinRequest
    sendWorkspaceJoinRequestReceivedEmail: SendWorkspaceJoinRequestReceivedEmail
    addOrUpdateWorkspaceRole: AddOrUpdateWorkspaceRole
    getUserById: GetUser
    getWorkspaceWithDomains: GetWorkspaceWithDomains
    getWorkspaceTeam: GetWorkspaceCollaborators
    getUserEmails: FindEmailsByUserId
  }) =>
  async ({ userId, workspaceId }: { userId: string; workspaceId: string }) => {
    const requester = await getUserById(userId)
    if (!requester) {
      throw new NotFoundError('User not found')
    }

    const workspace = await getWorkspaceWithDomains({ id: workspaceId })
    if (!workspace) {
      throw new WorkspaceNotFoundError('Workspace not found')
    }
    if (!workspace?.discoverabilityEnabled) throw new WorkspaceNotDiscoverableError()
    const workspaceDomains = workspace.domains.filter((domain) => domain.verified)
    if (!workspaceDomains.length) throw new WorkspaceNotJoinableError()

    const userEmails = await getUserEmails({ userId })

    const canJoinWorkspace = userEmailsCompliantWithWorkspaceDomains({
      workspaceDomains: workspace.domains,
      userEmails
    })
    if (!canJoinWorkspace) {
      throw new WorkspaceProtectedError()
    }

    if (workspace.discoverabilityAutoJoinEnabled) {
      const {
        items: [workspaceAdmin]
      } = await getWorkspaceTeam({
        workspaceId,
        limit: 1,
        filter: {
          roles: [Roles.Workspace.Admin]
        }
      })
      await addOrUpdateWorkspaceRole({
        userId,
        workspaceId,
        role: Roles.Workspace.Member,
        updatedByUserId: workspaceAdmin.id
      })
      return true
    }

    const joinRequest = await createWorkspaceJoinRequest({
      workspaceJoinRequest: {
        userId,
        workspaceId,
        status: 'pending'
      }
    })

    if (!joinRequest || joinRequest.status !== 'pending') {
      // The request was already created, so don't send the email again
      return true
    }

    await sendWorkspaceJoinRequestReceivedEmail({
      workspace,
      requester
    })

    return true
  }

export const approveWorkspaceJoinRequestFactory =
  ({
    updateWorkspaceJoinRequestStatus,
    sendWorkspaceJoinRequestApprovedEmail,
    getUserById,
    getWorkspace,
    getWorkspaceJoinRequest,
    emit,
    addOrUpdateWorkspaceRole
  }: {
    updateWorkspaceJoinRequestStatus: UpdateWorkspaceJoinRequestStatus
    sendWorkspaceJoinRequestApprovedEmail: SendWorkspaceJoinRequestApprovedEmail
    getUserById: GetUser
    getWorkspace: GetWorkspace
    getWorkspaceJoinRequest: GetWorkspaceJoinRequest
    emit: EventBus['emit']
    addOrUpdateWorkspaceRole: AddOrUpdateWorkspaceRole
  }): ApproveWorkspaceJoinRequest =>
  async ({ userId, workspaceId, approvedByUserId }) => {
    const requester = await getUserById(userId)
    if (!requester) {
      throw new NotFoundError('User not found')
    }

    const workspace = await getWorkspace({ workspaceId })
    if (!workspace) {
      throw new WorkspaceNotFoundError('Workspace not found')
    }

    const request = await getWorkspaceJoinRequest({
      userId,
      workspaceId,
      status: 'pending'
    })
    if (!request) {
      throw new NotFoundError('Workspace join request not found')
    }

    await updateWorkspaceJoinRequestStatus({
      userId,
      workspaceId,
      status: 'approved'
    })

    await addOrUpdateWorkspaceRole({
      userId,
      workspaceId,
      role: Roles.Workspace.Member,
      updatedByUserId: approvedByUserId
    })

    await emit({ eventName: WorkspaceEvents.Updated, payload: { workspace } })

    await sendWorkspaceJoinRequestApprovedEmail({
      workspace,
      requester
    })

    return true
  }

export const denyWorkspaceJoinRequestFactory =
  ({
    updateWorkspaceJoinRequestStatus,
    sendWorkspaceJoinRequestDeniedEmail,
    getUserById,
    getWorkspace,
    getWorkspaceJoinRequest
  }: {
    updateWorkspaceJoinRequestStatus: UpdateWorkspaceJoinRequestStatus
    sendWorkspaceJoinRequestDeniedEmail: SendWorkspaceJoinRequestDeniedEmail
    getUserById: GetUser
    getWorkspace: GetWorkspace
    getWorkspaceJoinRequest: GetWorkspaceJoinRequest
  }): DenyWorkspaceJoinRequest =>
  async ({ userId, workspaceId }) => {
    const requester = await getUserById(userId)
    if (!requester) {
      throw new NotFoundError('User not found')
    }

    const workspace = await getWorkspace({ workspaceId })
    if (!workspace) {
      throw new WorkspaceNotFoundError('Workspace not found')
    }

    const request = await getWorkspaceJoinRequest({
      userId,
      workspaceId,
      status: 'pending'
    })
    if (!request) {
      throw new NotFoundError('Workspace join request not found')
    }

    await updateWorkspaceJoinRequestStatus({
      userId,
      workspaceId,
      status: 'denied'
    })

    await sendWorkspaceJoinRequestDeniedEmail({
      workspace,
      requester
    })

    return true
  }
