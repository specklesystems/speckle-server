import { err, ok } from 'true-myth/result'
import { AuthCheckContextLoaderKeys } from '../../domain/loaders.js'
import { MaybeUserContext, WorkspaceContext } from '../../domain/context.js'
import {
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
  | typeof AuthCheckContextLoaderKeys.getWorkspaceRole
  | typeof AuthCheckContextLoaderKeys.getWorkspacePlan

type PolicyArgs = MaybeUserContext & WorkspaceContext

type PolicyErrors = InstanceType<
  | typeof DashboardsNotEnabledError
  | typeof WorkspaceNotEnoughPermissionsError
  | typeof WorkspacePlanNoFeatureAccessError
>

export const canListDashboardsPolicy: AuthPolicy<
  PolicyLoaderKeys,
  PolicyArgs,
  PolicyErrors
> =
  (loaders) =>
  async ({ userId, workspaceId }) => {
    const isDashboardsEnabled = await ensureDashboardsEnabledFragment(loaders)({})
    if (isDashboardsEnabled.isErr) return err(isDashboardsEnabled.error)

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
