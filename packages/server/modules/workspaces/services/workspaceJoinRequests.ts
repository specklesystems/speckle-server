import { UpdateWorkspaceJoinRequestStatus } from '@/modules/workspaces/domain/operations'
import { WorkspaceJoinRequestNotFoundError } from '@/modules/workspaces/errors/workspace'

export const dismissWorkspaceJoinRequestFactory =
  ({
    updateWorkspaceJoinRequestStatus
  }: {
    updateWorkspaceJoinRequestStatus: UpdateWorkspaceJoinRequestStatus
  }) =>
  async ({ userId, workspaceId }: { userId: string; workspaceId: string }) => {
    const updated = await updateWorkspaceJoinRequestStatus({
      userId,
      workspaceId,
      status: 'dismissed'
    })
    if (!updated) {
      throw new WorkspaceJoinRequestNotFoundError()
    }
    return true
  }
