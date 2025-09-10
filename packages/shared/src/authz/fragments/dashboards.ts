import { err, ok } from 'true-myth/result'
import {
  DashboardNotFoundError,
  DashboardProjectsNotEnoughPermissionsError,
  DashboardsNotEnabledError,
  WorkspacePlanNoFeatureAccessError
} from '../domain/authErrors.js'
import { Loaders } from '../domain/loaders.js'
import { AuthPolicyEnsureFragment } from '../domain/policies.js'
import { DashboardContext, UserContext, WorkspaceContext } from '../domain/context.js'
import {
  isWorkspaceFeatureFlagOn,
  WorkspaceFeatureFlags
} from '../../workspaces/index.js'
import { ensureMinimumProjectRoleFragment } from './projects.js'

export const ensureDashboardsEnabledFragment: AuthPolicyEnsureFragment<
  typeof Loaders.getEnv,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  {},
  InstanceType<typeof DashboardsNotEnabledError>
> = (loaders) => async () => {
  const env = await loaders.getEnv()
  if (!env.FF_DASHBOARDS_MODULE_ENABLED) return err(new DashboardsNotEnabledError())
  return ok()
}

export const ensureWorkspaceDashboardsFeatureAccessFragment: AuthPolicyEnsureFragment<
  typeof Loaders.getWorkspacePlan,
  WorkspaceContext,
  InstanceType<typeof WorkspacePlanNoFeatureAccessError>
> =
  (loaders) =>
  async ({ workspaceId }) => {
    const plan = await loaders.getWorkspacePlan({ workspaceId })
    if (!plan) return err(new WorkspacePlanNoFeatureAccessError())

    const isFlagOn = isWorkspaceFeatureFlagOn({
      workspaceFeatureFlags: plan.featureFlags,
      feature: WorkspaceFeatureFlags.dashboards
    })
    if (!isFlagOn) return err(new WorkspacePlanNoFeatureAccessError())

    return ok()
  }

export const ensureDashboardProjectsReadAccess: AuthPolicyEnsureFragment<
  | typeof Loaders.getDashboard
  | typeof Loaders.getProjectRole
  | typeof Loaders.getProject
  | typeof Loaders.getServerRole
  | typeof Loaders.getEnv
  | typeof Loaders.getWorkspaceRole
  | typeof Loaders.getWorkspace
  | typeof Loaders.getWorkspaceSsoProvider
  | typeof Loaders.getWorkspaceSsoSession,
  DashboardContext & UserContext,
  InstanceType<
    typeof DashboardNotFoundError | typeof DashboardProjectsNotEnoughPermissionsError
  >
> =
  (loaders) =>
  async ({ userId, dashboardId }) => {
    const dashboard = await loaders.getDashboard({ dashboardId })
    if (!dashboard) return err(new DashboardNotFoundError())

    const allProjectResults: [
      string,
      Awaited<ReturnType<ReturnType<typeof ensureMinimumProjectRoleFragment>>>
    ][] = await Promise.all(
      dashboard.projectIds.map(async (projectId) => {
        return [
          projectId,
          await ensureMinimumProjectRoleFragment(loaders)({ projectId, userId })
        ]
      })
    )

    const projectAccessErrors = allProjectResults.filter(([, e]) => e.isErr)

    return projectAccessErrors.length
      ? err(
          new DashboardProjectsNotEnoughPermissionsError({
            payload: {
              projectIds: projectAccessErrors.map(([projectId]) => projectId)
            }
          })
        )
      : ok()
  }
