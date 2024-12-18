import { GetWorkspacePlan } from '@/modules/gatekeeper/domain/billing'
import { Workspace } from '@/modules/workspacesCore/domain/types'
import { throwUncoveredError } from '@speckle/shared'

export const isWorkspaceReadOnlyFactory =
  ({ getWorkspacePlan }: { getWorkspacePlan: GetWorkspacePlan }) =>
  async ({ workspaceId }: { workspaceId: Workspace['id'] }) => {
    const workspacePlan = await getWorkspacePlan({ workspaceId })
    // Should never happen
    if (!workspacePlan) return true

    switch (workspacePlan.status) {
      case 'cancelationScheduled':
      case 'valid':
      case 'trial':
      case 'paymentFailed':
        return false
      case 'expired':
      case 'canceled':
        return true
      default:
        throwUncoveredError(workspacePlan)
    }
  }
