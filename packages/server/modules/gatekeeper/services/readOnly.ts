import { GetWorkspacePlan } from '@/modules/gatekeeper/domain/billing'
import { Workspace } from '@/modules/workspacesCore/domain/types'
import { z } from 'zod'
import {
  workspacePlanStatusCanceled,
  workspacePlanStatusExpired,
  workspacePlanStatusPaymentFailed
} from '@/modules/gatekeeper/domain/constants'

const readOnlyWorkspacePlanStatuses = z.union([
  workspacePlanStatusPaymentFailed,
  workspacePlanStatusCanceled,
  workspacePlanStatusExpired
])

export const isWorkspaceReadOnlyFactory =
  ({ getWorkspacePlan }: { getWorkspacePlan: GetWorkspacePlan }) =>
  async ({ workspaceId }: { workspaceId: Workspace['id'] }) => {
    const workspacePlan = await getWorkspacePlan({ workspaceId })
    // Should never happen
    if (!workspacePlan) return true

    const { success: workspaceReadOnly } = readOnlyWorkspacePlanStatuses.safeParse(
      workspacePlan.status
    )

    return workspaceReadOnly
  }
