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
  ensureUserIsWorkspaceAdminFragment,
  ensureWorkspaceNotReadOnlyFragment
} from '../../fragments/workspaces.js'
import {
  WorkspacePlanFeatures,
  workspacePlanHasAccessToFeature
} from '../../../workspaces/index.js'

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
      const ensuredNotReadOnly = await ensureWorkspaceNotReadOnlyFragment(loaders)({
        workspaceId
      })
      if (ensuredNotReadOnly.isErr) return err(ensuredNotReadOnly.error)

      const workspacePlan = await loaders.getWorkspacePlan({ workspaceId })
      if (!workspacePlan) return err(new WorkspacePlanNoFeatureAccessError())
      const canUseFeature = workspacePlanHasAccessToFeature({
        plan: workspacePlan.name,
        feature
      })
      return canUseFeature ? ok() : err(new WorkspacePlanNoFeatureAccessError())
    }
