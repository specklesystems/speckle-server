import { err, ok } from 'true-myth/result'
import {
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  ProjectNotFoundError,
  ProjectNoAccessError,
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError,
  ProjectNotEnoughPermissionsError,
  WorkspaceNotEnoughPermissionsError,
  WorkspacePlanNoFeatureAccessError,
  AccIntegrationNotEnabledError
} from '../../domain/authErrors.js'
import { MaybeUserContext, ProjectContext } from '../../domain/context.js'
import { Loaders } from '../../domain/loaders.js'
import { AuthPolicy } from '../../domain/policies.js'
import { ensureImplicitProjectMemberWithReadAccessFragment } from '../../fragments/projects.js'
import {
  isWorkspaceFeatureFlagOn,
  WorkspaceFeatureFlags
} from '../../../workspaces/index.js'

type PolicyLoaderKeys =
  | typeof Loaders.getEnv
  | typeof Loaders.getServerRole
  | typeof Loaders.getAdminOverrideEnabled
  | typeof Loaders.getProject
  | typeof Loaders.getWorkspaceRole
  | typeof Loaders.getWorkspace
  | typeof Loaders.getWorkspaceSsoProvider
  | typeof Loaders.getWorkspaceSsoSession
  | typeof Loaders.getProjectRole
  | typeof Loaders.getWorkspacePlan

type PolicyArgs = MaybeUserContext & ProjectContext

type PolicyErrors = InstanceType<
  | typeof ServerNoAccessError
  | typeof ServerNoSessionError
  | typeof ServerNotEnoughPermissionsError
  | typeof ProjectNotFoundError
  | typeof ProjectNoAccessError
  | typeof WorkspaceNoAccessError
  | typeof WorkspaceSsoSessionNoAccessError
  | typeof ProjectNotEnoughPermissionsError
  | typeof WorkspaceNotEnoughPermissionsError
  | typeof WorkspacePlanNoFeatureAccessError
  | typeof AccIntegrationNotEnabledError
>

export const canReadAccIntegrationSettingsPolicy: AuthPolicy<
  PolicyLoaderKeys,
  PolicyArgs,
  PolicyErrors
> =
  (loaders) =>
  async ({ userId, projectId }) => {
    const env = await loaders.getEnv()
    const project = await loaders.getProject({ projectId })

    if (!env.FF_ACC_INTEGRATION_ENABLED || !project?.workspaceId) {
      return err(new AccIntegrationNotEnabledError())
    }

    const ensuredProjectRole = await ensureImplicitProjectMemberWithReadAccessFragment(
      loaders
    )({
      userId,
      projectId
    })
    if (ensuredProjectRole.isErr) {
      return err(ensuredProjectRole.error)
    }

    const workspacePlan = await loaders.getWorkspacePlan({
      workspaceId: project.workspaceId
    })
    if (!workspacePlan) return err(new WorkspacePlanNoFeatureAccessError())
    const canUseFeature = isWorkspaceFeatureFlagOn({
      workspaceFeatureFlags: workspacePlan.featureFlags,
      feature: WorkspaceFeatureFlags.accIntegration
    })
    if (!canUseFeature) return err(new WorkspacePlanNoFeatureAccessError())

    return ok()
  }
