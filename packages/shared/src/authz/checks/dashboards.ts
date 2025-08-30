import { DashboardContext, UserContext } from '../domain/context.js'
import { AuthCheckContextLoaderKeys } from '../domain/loaders.js'
import { AuthPolicyCheck } from '../domain/policies.js'

export const isDashboardOwner: AuthPolicyCheck<
  typeof AuthCheckContextLoaderKeys.getDashboard,
  UserContext & DashboardContext
> =
  (loaders) =>
  async ({ userId, dashboardId }) => {
    const dashboard = await loaders.getDashboard({ dashboardId })
    if (!dashboard) return false
    return dashboard.ownerId === userId
  }
