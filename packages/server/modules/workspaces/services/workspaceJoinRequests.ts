import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'
import { GetUser } from '@/modules/core/domain/users/operations'
import { NotFoundError } from '@/modules/shared/errors'
import {
  CreateWorkspaceJoinRequest,
  DenyWorkspaceJoinRequest,
  GetWorkspace,
  GetWorkspaceJoinRequest,
  SendWorkspaceJoinRequestApprovedEmail,
  SendWorkspaceJoinRequestDeniedEmail,
  SendWorkspaceJoinRequestReceivedEmail,
  UpdateWorkspaceJoinRequestStatus
} from '@/modules/workspaces/domain/operations'

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
    getUserById,
    getWorkspace
  }: {
    createWorkspaceJoinRequest: CreateWorkspaceJoinRequest
    sendWorkspaceJoinRequestReceivedEmail: SendWorkspaceJoinRequestReceivedEmail
    getUserById: GetUser
    getWorkspace: GetWorkspace
  }) =>
  async ({ userId, workspaceId }: { userId: string; workspaceId: string }) => {
    const requester = await getUserById(userId)
    if (!requester) {
      throw new NotFoundError('User not found')
    }

    const workspace = await getWorkspace({ workspaceId })
    if (!workspace) {
      throw new WorkspaceNotFoundError('Workspace not found')
    }

    await createWorkspaceJoinRequest({
      workspaceJoinRequest: {
        userId,
        workspaceId,
        status: 'pending'
      }
    })

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
    getWorkspaceJoinRequest
  }: {
    updateWorkspaceJoinRequestStatus: UpdateWorkspaceJoinRequestStatus
    sendWorkspaceJoinRequestApprovedEmail: SendWorkspaceJoinRequestApprovedEmail
    getUserById: GetUser
    getWorkspace: GetWorkspace
    getWorkspaceJoinRequest: GetWorkspaceJoinRequest
  }) =>
  async ({ userId, workspaceId }: { userId: string; workspaceId: string }) => {
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
