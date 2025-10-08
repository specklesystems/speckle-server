import type { Logger } from '@/observability/logging'
import type {
  DeleteWorkspace,
  GetWorkspacesNonComplete
} from '@/modules/workspaces/domain/operations'
import dayjs from 'dayjs'

export const deleteWorkspacesNonCompleteFactory =
  ({
    getWorkspacesNonComplete,
    deleteWorkspace
  }: {
    getWorkspacesNonComplete: GetWorkspacesNonComplete
    deleteWorkspace: DeleteWorkspace
  }) =>
  async ({ logger }: { logger: Logger }): Promise<void> => {
    const thirtyMinutesAgo = dayjs().subtract(30, 'minutes')

    const workspaces = await getWorkspacesNonComplete({
      createdAtBefore: thirtyMinutesAgo.toDate()
    })
    if (!workspaces?.length) return

    const workspaceIds = workspaces.map((workspace) => workspace.workspaceId)
    logger.info({ workspaceIds }, 'Deleting non complete workspaces')

    for (const workspaceId of workspaceIds) {
      await deleteWorkspace({ workspaceId, userId: null })
    }
  }
