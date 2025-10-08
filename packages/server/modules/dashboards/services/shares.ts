import { DashboardMalformedTokenError } from '@/modules/dashboards/errors/dashboards'
import type { RevokeUserTokenById } from '@/modules/core/domain/tokens/operations'
import type { DeleteDashboardToken } from '@/modules/dashboards/domain/tokens/operations'

export const deleteDashboardShareFactory =
  (deps: {
    deleteDashboardToken: DeleteDashboardToken
    revokeUserTokenById: RevokeUserTokenById
  }) =>
  async ({ shareId }: { shareId: string }) => {
    const dashboardToken = await deps.deleteDashboardToken({ tokenId: shareId })
    if (!dashboardToken) throw new DashboardMalformedTokenError()
    await deps.revokeUserTokenById(dashboardToken.tokenId, dashboardToken.userId)
  }
