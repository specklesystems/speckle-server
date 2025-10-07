import type { GetWorkspaceSummary } from '@/modules/activitystream/domain/operations'
import type { GetWorkspacePlansByWorkspaceId } from '@/modules/gatekeeper/domain/billing'
import type { CountWorkspaceUsers } from '@/modules/workspacesCore/domain/operations'
import { SeatTypes } from '@speckle/shared'
import { pick } from 'lodash-es'

export const getWorkspaceSummaryFactory =
  ({
    countWorkspaceUsers,
    getWorkspacePlansByWorkspaceId
  }: {
    countWorkspaceUsers: CountWorkspaceUsers
    getWorkspacePlansByWorkspaceId: GetWorkspacePlansByWorkspaceId
  }): GetWorkspaceSummary =>
  async (workspaceId) => {
    const [totalEditorSeats, totalViewerSeats, plans] = await Promise.all([
      countWorkspaceUsers({
        workspaceId,
        filter: { seatType: SeatTypes.Editor }
      }),
      countWorkspaceUsers({
        workspaceId,
        filter: { seatType: SeatTypes.Viewer }
      }),
      getWorkspacePlansByWorkspaceId({
        workspaceIds: [workspaceId]
      })
    ])

    const plan = plans[workspaceId]

    return {
      plan: pick(plan, ['name', 'status']),
      totalEditorSeats,
      totalViewerSeats
    }
  }
