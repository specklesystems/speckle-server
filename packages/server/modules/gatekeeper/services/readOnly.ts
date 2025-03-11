import { GetWorkspacePlan } from '@/modules/gatekeeper/domain/billing'
import { GetWorkspacePlanByProjectId } from '@/modules/gatekeeper/domain/operations'
import { WorkspacePlan } from '@/modules/gatekeeperCore/domain/billing'
import { Workspace } from '@/modules/workspacesCore/domain/types'
import { throwUncoveredError } from '@speckle/shared'

const isWorkspacePlanStatusReadOnly = (status: WorkspacePlan['status']) => {
  switch (status) {
    case 'cancelationScheduled':
    case 'valid':
    case 'trial':
    case 'paymentFailed':
      return false
    case 'expired':
    case 'canceled':
      return true
    default:
      throwUncoveredError(status)
  }
}

export const isWorkspaceReadOnlyFactory =
  ({ getWorkspacePlan }: { getWorkspacePlan: GetWorkspacePlan }) =>
  async ({ workspaceId }: { workspaceId: Workspace['id'] }) => {
    const workspacePlan = await getWorkspacePlan({ workspaceId })
    // Should never happen
    if (!workspacePlan) return true
    return isWorkspacePlanStatusReadOnly(workspacePlan.status)
  }

export const isProjectReadOnlyFactory =
  ({
    getWorkspacePlanByProjectId
  }: {
    getWorkspacePlanByProjectId: GetWorkspacePlanByProjectId
  }) =>
  async ({ projectId }: { projectId: string }) => {
    const workspacePlan = await getWorkspacePlanByProjectId({ projectId })
    if (!workspacePlan) return false // The project is not in a workspace
    return isWorkspacePlanStatusReadOnly(workspacePlan.status)
  }
