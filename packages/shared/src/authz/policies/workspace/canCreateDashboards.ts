import { err, ok } from 'true-myth/result'
import { AuthCheckContextLoaderKeys } from '../../domain/loaders.js'
import { MaybeUserContext, WorkspaceContext } from '../../domain/context.js'
import {
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
import { checkIfAdminOverrideEnabledFragment } from '../../fragments/server.js'

type PolicyLoaderKeys =
  | typeof AuthCheckContextLoaderKeys.getEnv
  | typeof AuthCheckContextLoaderKeys.getServerRole
  | typeof AuthCheckContextLoaderKeys.getAdminOverrideEnabled
  | typeof AuthCheckContextLoaderKeys.getWorkspacePlan
  | typeof AuthCheckContextLoaderKeys.getWorkspaceRole
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSeat

type PolicyArgs = MaybeUserContext & WorkspaceContext

type PolicyErrors = InstanceType<
  | typeof DashboardsNotEnabledError
  | typeof WorkspaceNotEnoughPermissionsError
  | typeof WorkspacePlanNoFeatureAccessError
  | typeof WorkspaceNoEditorSeatError
>

export const canCreateDashboardsPolicy: AuthPolicy<
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

    const hasAdminAccess = await checkIfAdminOverrideEnabledFragment(loaders)({
      userId
    })
    if (hasAdminAccess.isOk && hasAdminAccess.value) return ok()

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

    return ok()
  }
