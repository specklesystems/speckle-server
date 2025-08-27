import { err, ok } from 'true-myth/result'
import {
  DashboardsNotEnabledError,
  WorkspacePlanNoFeatureAccessError
} from '../domain/authErrors.js'
import { Loaders } from '../domain/loaders.js'
import { AuthPolicyEnsureFragment } from '../domain/policies.js'
import { WorkspaceContext } from '../domain/context.js'
import {
  isWorkspaceFeatureFlagOn,
  WorkspaceFeatureFlags
} from '../../workspaces/index.js'

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
