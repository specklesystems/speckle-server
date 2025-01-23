import {
  WorkspaceNotDiscoverableError,
  WorkspaceNotFoundError,
  WorkspaceNotJoinableError,
  WorkspaceProtectedError
} from '@/modules/workspaces/errors/workspace'
import { GetUser } from '@/modules/core/domain/users/operations'
import { NotFoundError } from '@/modules/shared/errors'
import {
  CreateWorkspaceJoinRequest,
  DenyWorkspaceJoinRequest,
  GetWorkspace,
  GetWorkspaceJoinRequest,
  GetWorkspaceWithDomains,
  SendWorkspaceJoinRequestApprovedEmail,
  SendWorkspaceJoinRequestDeniedEmail,
  SendWorkspaceJoinRequestReceivedEmail,
  UpdateWorkspaceJoinRequestStatus,
  UpsertWorkspaceRole
} from '@/modules/workspaces/domain/operations'
import { Roles } from '@speckle/shared'
import { FindEmailsByUserId } from '@/modules/core/domain/userEmails/operations'
import { userEmailsCompliantWithWorkspaceDomains } from '@/modules/workspaces/domain/logic'

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
    getWorkspaceWithDomains,
    getUserEmails
  }: {
    createWorkspaceJoinRequest: CreateWorkspaceJoinRequest
    sendWorkspaceJoinRequestReceivedEmail: SendWorkspaceJoinRequestReceivedEmail
    getUserById: GetUser
    getWorkspaceWithDomains: GetWorkspaceWithDomains
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
    getWorkspaceJoinRequest,
    upsertWorkspaceRole
  }: {
    updateWorkspaceJoinRequestStatus: UpdateWorkspaceJoinRequestStatus
    sendWorkspaceJoinRequestApprovedEmail: SendWorkspaceJoinRequestApprovedEmail
    getUserById: GetUser
    getWorkspace: GetWorkspace
    getWorkspaceJoinRequest: GetWorkspaceJoinRequest
    upsertWorkspaceRole: UpsertWorkspaceRole
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

    const role = Roles.Workspace.Member
    await upsertWorkspaceRole({ userId, workspaceId, role, createdAt: new Date() })

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
