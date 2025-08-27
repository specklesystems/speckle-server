import { DashboardContext, UserContext } from '../domain/context.js'
import { AuthPolicyCheck } from '../domain/policies.js'

export const isDashboardOwner: AuthPolicyCheck<
  'getDashboard',
  UserContext & DashboardContext
> =
  (loaders) =>
  async ({ userId, dashboardId }) => {
    const dashboard = await loaders.getDashboard({ dashboardId })
    if (!dashboard) return false
    return dashboard.ownerId === userId
  }
