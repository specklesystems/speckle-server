import { err, ok } from 'true-myth/result'
import { AuthCheckContextLoaderKeys } from '../../domain/loaders.js'
import { DashboardContext, MaybeUserContext } from '../../domain/context.js'
import {
  DashboardNoProjectsError,
  DashboardNotFoundError,
  DashboardProjectsNotEnoughPermissionsError,
  DashboardsNotEnabledError,
  WorkspaceNoEditorSeatError,
  WorkspaceNotEnoughPermissionsError,
  WorkspacePlanNoFeatureAccessError
} from '../../domain/authErrors.js'
import { AuthPolicy } from '../../domain/policies.js'
import {
  ensureDashboardProjectsReadAccess,
  ensureDashboardsEnabledFragment,
  ensureWorkspaceDashboardsFeatureAccessFragment
} from '../../fragments/dashboards.js'
import { hasMinimumWorkspaceRole } from '../../checks/workspaceRole.js'
import { Roles } from '../../../core/constants.js'
import { hasEditorSeat } from '../../checks/workspaceSeat.js'

type PolicyLoaderKeys =
  | typeof AuthCheckContextLoaderKeys.getEnv
  | typeof AuthCheckContextLoaderKeys.getDashboard
  | typeof AuthCheckContextLoaderKeys.getWorkspacePlan
  | typeof AuthCheckContextLoaderKeys.getWorkspaceRole
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSeat
  | typeof AuthCheckContextLoaderKeys.getProjectRole
  | typeof AuthCheckContextLoaderKeys.getProject
  | typeof AuthCheckContextLoaderKeys.getServerRole
  | typeof AuthCheckContextLoaderKeys.getWorkspace
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSsoProvider
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSsoSession

type PolicyArgs = MaybeUserContext & DashboardContext

type PolicyErrors = InstanceType<
  | typeof DashboardsNotEnabledError
  | typeof WorkspaceNotEnoughPermissionsError
  | typeof WorkspacePlanNoFeatureAccessError
  | typeof WorkspaceNoEditorSeatError
  | typeof DashboardNotFoundError
  | typeof DashboardNoProjectsError
  | typeof DashboardProjectsNotEnoughPermissionsError
>

export const canCreateDashboardTokenPolicy: AuthPolicy<
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

    const isWorkspaceEditorSeat = await hasEditorSeat(loaders)({
      userId: userId!,
      workspaceId
    })
    if (!isWorkspaceEditorSeat) return err(new WorkspaceNoEditorSeatError())

    if (!dashboard.projectIds.length) return err(new DashboardNoProjectsError())
    const ensuredProjectAccess = await ensureDashboardProjectsReadAccess(loaders)({
      userId: userId!,
      dashboardId
    })
    if (ensuredProjectAccess.isErr) return err(ensuredProjectAccess.error)

    return ok()
  }
