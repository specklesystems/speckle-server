import type { GetWorkspacePlan } from '@/modules/gatekeeper/domain/billing'
import type { GetWorkspacePlanByProjectId } from '@/modules/gatekeeper/domain/operations'
import type { Workspace } from '@/modules/workspacesCore/domain/types'
import { isWorkspacePlanStatusReadOnly } from '@speckle/shared'

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
