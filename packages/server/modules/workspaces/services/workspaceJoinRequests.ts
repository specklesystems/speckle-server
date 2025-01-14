import {
  GetWorkspace,
  UpdateWorkspaceJoinRequestStatus
} from '@/modules/workspaces/domain/operations'
import { WorkspaceNotFoundError } from '@/modules/workspaces/errors/workspace'

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
