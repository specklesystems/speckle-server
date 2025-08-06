import { Roles } from '../../../../core/constants.js'
import { WorkspacePlanFeatures } from '../../../../workspaces/index.js'
import {
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError,
  ProjectNotFoundError,
  SavedViewNotFoundError,
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

export const canUpdateSavedViewPolicy: AuthPolicy<
  | typeof Loaders.getSavedView
  | typeof Loaders.getProject
  | typeof Loaders.getEnv
  | typeof Loaders.getServerRole
  | typeof Loaders.getWorkspaceRole
  | typeof Loaders.getWorkspace
  | typeof Loaders.getWorkspaceSsoProvider
  | typeof Loaders.getWorkspacePlan
  | typeof Loaders.getWorkspaceSsoSession
  | typeof Loaders.getProjectRole,
  MaybeUserContext &
    ProjectContext & {
      savedViewId: string
    },
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
    | typeof SavedViewNotFoundError
  >
> =
  (loaders) =>
  async ({ userId, projectId, savedViewId }) => {
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
      if (ensuredWriteAccess.error.code === ProjectNotEnoughPermissionsError.code)
        return err(
          new ProjectNotEnoughPermissionsError({
            message:
              "Your role on this project doesn't give you permission to update saved views."
          })
        )
      return err(ensuredWriteAccess.error)
    }

    // Even if user has access to project - must be author OR project admin
    const savedView = await loaders.getSavedView({
      projectId,
      savedViewId
    })
    if (!savedView) return err(new SavedViewNotFoundError())

    if (savedView.authorId !== userId) {
      const ensuredWriteAccess =
        await ensureImplicitProjectMemberWithWriteAccessFragment(loaders)({
          userId,
          projectId,
          role: Roles.Stream.Owner
        })
      if (ensuredWriteAccess.isErr) {
        if (ensuredWriteAccess.error.code === ProjectNotEnoughPermissionsError.code)
          return err(
            new ProjectNotEnoughPermissionsError({
              message: "Only project owners can update saved views they don't own."
            })
          )
        return err(ensuredWriteAccess.error)
      }
    }

    return ok()
  }
