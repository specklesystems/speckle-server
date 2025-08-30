import { err, ok } from 'true-myth/result'
import { AuthCheckContextLoaderKeys } from '../../domain/loaders.js'
import { DashboardContext, MaybeUserContext } from '../../domain/context.js'
import {
  DashboardNotFoundError,
  DashboardsNotEnabledError,
  WorkspaceNotEnoughPermissionsError,
  WorkspacePlanNoFeatureAccessError
} from '../../domain/authErrors.js'
import { AuthPolicy } from '../../domain/policies.js'
import {
  ensureDashboardsEnabledFragment,
  ensureWorkspaceDashboardsFeatureAccessFragment
} from '../../fragments/dashboards.js'
import { hasMinimumWorkspaceRole } from '../../checks/workspaceRole.js'
import { Roles } from '../../../core/constants.js'

type PolicyLoaderKeys =
  | typeof AuthCheckContextLoaderKeys.getEnv
  | typeof AuthCheckContextLoaderKeys.getDashboard
  | typeof AuthCheckContextLoaderKeys.getWorkspaceRole
  | typeof AuthCheckContextLoaderKeys.getWorkspacePlan

type PolicyArgs = MaybeUserContext & DashboardContext

type PolicyErrors = InstanceType<
  | typeof DashboardsNotEnabledError
  | typeof DashboardNotFoundError
  | typeof WorkspaceNotEnoughPermissionsError
  | typeof WorkspacePlanNoFeatureAccessError
>

export const canReadDashboardPolicy: AuthPolicy<
  PolicyLoaderKeys,
  PolicyArgs,
  PolicyErrors
> =
  (loaders) =>
  async ({ userId, dashboardId }) => {
    const isDashboardsEnabled = await ensureDashboardsEnabledFragment(loaders)({})
    if (isDashboardsEnabled.isErr) return err(isDashboardsEnabled.error)

    const dashboard = await loaders.getDashboard({ dashboardId })
    if (!dashboard) return err(new DashboardNotFoundError())

    const { workspaceId } = dashboard

    const ensuredFeatureAccess = await ensureWorkspaceDashboardsFeatureAccessFragment(
      loaders
    )({ workspaceId })
    if (ensuredFeatureAccess.isErr) return err(ensuredFeatureAccess.error)

    const isWorkspaceMember = await hasMinimumWorkspaceRole(loaders)({
      userId: userId!,
      workspaceId,
      role: Roles.Workspace.Member
    })
    if (!isWorkspaceMember) return err(new WorkspaceNotEnoughPermissionsError())

    return ok()
  }
