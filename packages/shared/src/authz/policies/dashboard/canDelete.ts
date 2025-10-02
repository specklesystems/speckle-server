import { err, ok } from 'true-myth/result'
import { AuthCheckContextLoaderKeys } from '../../domain/loaders.js'
import { DashboardContext, MaybeUserContext } from '../../domain/context.js'
import {
  DashboardNotFoundError,
  DashboardNotOwnerError,
  DashboardsNotEnabledError,
  WorkspaceNoEditorSeatError,
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
import { hasEditorSeat } from '../../checks/workspaceSeat.js'
import { isDashboardOwner } from '../../checks/dashboards.js'
import { checkIfAdminOverrideEnabledFragment } from '../../fragments/server.js'

type PolicyLoaderKeys =
  | typeof AuthCheckContextLoaderKeys.getEnv
  | typeof AuthCheckContextLoaderKeys.getServerRole
  | typeof AuthCheckContextLoaderKeys.getAdminOverrideEnabled
  | typeof AuthCheckContextLoaderKeys.getDashboard
  | typeof AuthCheckContextLoaderKeys.getWorkspacePlan
  | typeof AuthCheckContextLoaderKeys.getWorkspaceRole
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSeat

type PolicyArgs = MaybeUserContext & DashboardContext

type PolicyErrors = InstanceType<
  | typeof DashboardsNotEnabledError
  | typeof DashboardNotOwnerError
  | typeof DashboardNotFoundError
  | typeof WorkspaceNotEnoughPermissionsError
  | typeof WorkspacePlanNoFeatureAccessError
  | typeof WorkspaceNoEditorSeatError
>

export const canDeleteDashboardPolicy: AuthPolicy<
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

    const hasAdminAccess = await checkIfAdminOverrideEnabledFragment(loaders)({
      userId
    })
    if (hasAdminAccess.isOk && hasAdminAccess.value) return ok()

    const isWorkspaceEditorSeat = await hasEditorSeat(loaders)({
      userId: userId!,
      workspaceId
    })
    if (!isWorkspaceEditorSeat) return err(new WorkspaceNoEditorSeatError())

    const isWorkspaceAdmin = await hasMinimumWorkspaceRole(loaders)({
      userId: userId!,
      workspaceId,
      role: Roles.Workspace.Admin
    })
    const isOwner = await isDashboardOwner(loaders)({ userId: userId!, dashboardId })

    if (!isWorkspaceAdmin && !isOwner) return err(new DashboardNotOwnerError())

    return ok()
  }
