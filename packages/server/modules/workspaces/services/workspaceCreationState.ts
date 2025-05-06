import { Logger } from '@/observability/logging'
import {
  DeleteWorkspace,
  GetWorkspacesNonComplete
} from '@/modules/workspaces/domain/operations'

export const deleteWorkspacesNonCompleteFactory =
  ({
    getWorkspacesNonComplete,
    deleteWorkspace
  }: {
    getWorkspacesNonComplete: GetWorkspacesNonComplete
    deleteWorkspace: DeleteWorkspace
  }) =>
  async ({ logger }: { logger: Logger }): Promise<void> => {
    const workspaces = await getWorkspacesNonComplete()
    if (!workspaces?.length) return

    const workspaceIds = workspaces.map((workspace) => workspace.workspaceId)
    logger.info('Deleting non complete workspaces', { workspaceIds })

    workspaceIds.forEach(async (workspaceId) => await deleteWorkspace({ workspaceId }))
  }
