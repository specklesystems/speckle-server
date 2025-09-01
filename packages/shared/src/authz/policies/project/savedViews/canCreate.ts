import { Roles } from '../../../../core/constants.js'
import { WorkspacePlanFeatures } from '../../../../workspaces/index.js'
import {
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  WorkspaceNoAccessError,
  WorkspaceNotEnoughPermissionsError,
  WorkspacePlanNoFeatureAccessError,
  WorkspaceReadOnlyError,
  WorkspacesNotEnabledError,
  WorkspaceSsoSessionNoAccessError
} from '../../../domain/authErrors.js'
import { MaybeUserContext, ProjectContext } from '../../../domain/context.js'
import { Loaders } from '../../../domain/loaders.js'
import { AuthPolicy } from '../../../domain/policies.js'
import {
  ensureCanUseProjectWorkspacePlanFeatureFragment,
  ensureImplicitProjectMemberWithWriteAccessFragment
} from '../../../fragments/projects.js'
import { err, ok } from 'true-myth/result'

export const canCreateSavedViewPolicy: AuthPolicy<
  | typeof Loaders.getProject
  | typeof Loaders.getEnv
  | typeof Loaders.getServerRole
  | typeof Loaders.getWorkspaceRole
  | typeof Loaders.getWorkspace
  | typeof Loaders.getWorkspaceSsoProvider
  | typeof Loaders.getWorkspacePlan
  | typeof Loaders.getWorkspaceSsoSession
  | typeof Loaders.getProjectRole,
  MaybeUserContext & ProjectContext,
  InstanceType<
    | typeof ProjectNotFoundError
    | typeof ServerNoAccessError
    | typeof ServerNoSessionError
    | typeof ProjectNoAccessError
    | typeof WorkspaceNoAccessError
    | typeof WorkspaceSsoSessionNoAccessError
    | typeof ServerNotEnoughPermissionsError
    | typeof ProjectNotEnoughPermissionsError
    | typeof WorkspaceNotEnoughPermissionsError
    | typeof WorkspacePlanNoFeatureAccessError
    | typeof WorkspaceReadOnlyError
    | typeof WorkspacesNotEnabledError
  >
> =
  (loaders) =>
  async ({ userId, projectId }) => {
    const canUseSavedViews = await ensureCanUseProjectWorkspacePlanFeatureFragment(
      loaders
    )({
      projectId,
      feature: WorkspacePlanFeatures.SavedViews
    })
    if (canUseSavedViews.isErr) return err(canUseSavedViews.error)

    const ensuredWriteAccess = await ensureImplicitProjectMemberWithWriteAccessFragment(
      loaders
    )({
      userId,
      projectId,
      role: Roles.Stream.Contributor
    })
    if (ensuredWriteAccess.isErr) {
      if (ensuredWriteAccess.error.code === 'ProjectNotEnoughPermissions')
        return err(
          new ProjectNotEnoughPermissionsError({
            message:
              "Your role on this project doesn't give you permission to save views. You need the Can edit or Project owner role."
          })
        )
      return err(ensuredWriteAccess.error)
    }

    return ok()
  }
