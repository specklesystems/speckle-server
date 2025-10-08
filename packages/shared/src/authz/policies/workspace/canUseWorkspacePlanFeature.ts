import { err, ok } from 'true-myth/result'
import {
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  WorkspaceNoAccessError,
  WorkspacePlanNoFeatureAccessError,
  WorkspaceNotEnoughPermissionsError,
  WorkspaceReadOnlyError,
  WorkspacesNotEnabledError,
  WorkspaceSsoSessionNoAccessError
} from '../../domain/authErrors.js'
import { MaybeUserContext, WorkspaceContext } from '../../domain/context.js'
import { AuthCheckContextLoaderKeys } from '../../domain/loaders.js'
import { AuthPolicy } from '../../domain/policies.js'
import {
  ensureCanUseWorkspacePlanFeatureFragment,
  ensureUserIsWorkspaceAdminFragment
} from '../../fragments/workspaces.js'
import { WorkspacePlanFeatures } from '../../../workspaces/index.js'

type PolicyLoaderKeys =
  | typeof AuthCheckContextLoaderKeys.getEnv
  | typeof AuthCheckContextLoaderKeys.getServerRole
  | typeof AuthCheckContextLoaderKeys.getWorkspace
  | typeof AuthCheckContextLoaderKeys.getWorkspaceRole
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSsoProvider
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSsoSession
  | typeof AuthCheckContextLoaderKeys.getWorkspacePlan

type PolicyArgs = MaybeUserContext &
  WorkspaceContext & { feature: WorkspacePlanFeatures }

type PolicyErrors =
  | InstanceType<typeof WorkspaceNoAccessError>
  | InstanceType<typeof WorkspaceSsoSessionNoAccessError>
  | InstanceType<typeof WorkspaceReadOnlyError>
  | InstanceType<typeof WorkspacesNotEnabledError>
  | InstanceType<typeof ServerNoSessionError>
  | InstanceType<typeof ServerNoAccessError>
  | InstanceType<typeof ServerNotEnoughPermissionsError>
  | InstanceType<typeof WorkspaceNotEnoughPermissionsError>
  | InstanceType<typeof WorkspacePlanNoFeatureAccessError>

/**
 * TODO: Refactor. Just use the fragment if you want to check if a workspace has access to a feature,
 * and create more specific policies for the actual use cases, cause policies shouldn't be reusable
 * building blocks like this.
 */
export const canUseWorkspacePlanFeature: AuthPolicy<
  PolicyLoaderKeys,
  PolicyArgs,
  PolicyErrors
> =
  (loaders) =>
  async ({ userId, workspaceId, feature }) => {
    const isWorkspaceAdmin = await ensureUserIsWorkspaceAdminFragment(loaders)({
      userId,
      workspaceId
    })
    if (isWorkspaceAdmin.isErr) return err(isWorkspaceAdmin.error)

    const canUseFeature = await ensureCanUseWorkspacePlanFeatureFragment(loaders)({
      workspaceId,
      feature
    })
    if (canUseFeature.isErr) return err(canUseFeature.error)
    return ok()
  }
