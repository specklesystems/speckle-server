import { Roles } from '../../../../core/constants.js'
import { isUngroupedGroup } from '../../../../saved-views/index.js'
import { WorkspacePlanFeatures } from '../../../../workspaces/index.js'
import {
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError,
  ProjectNotFoundError,
  SavedViewGroupNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  UngroupedSavedViewGroupLockError,
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

export const canUpdateSavedViewGroupPolicy: AuthPolicy<
  | typeof Loaders.getSavedViewGroup
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
      groupId: string
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
    | typeof SavedViewGroupNotFoundError
    | typeof UngroupedSavedViewGroupLockError
  >
> =
  (loaders) =>
  async ({ userId, projectId, groupId }) => {
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
              "Your role on this project doesn't give you permission to update saved views. You need to be the author of the view or the Project owner."
          })
        )
      return err(ensuredWriteAccess.error)
    }

    // Even if user has access to project - must be author OR project admin
    const savedViewGroup = await loaders.getSavedViewGroup({
      projectId,
      groupId
    })
    if (!savedViewGroup) return err(new SavedViewGroupNotFoundError())

    // Prevent default group updates (as it doesnt exist)
    if (isUngroupedGroup(savedViewGroup.id)) {
      return err(new UngroupedSavedViewGroupLockError())
    }

    if (savedViewGroup.authorId !== userId) {
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
              message:
                "Only project owners can update saved view groups they don't own."
            })
          )
        return err(ensuredWriteAccess.error)
      }
    }

    return ok()
  }
