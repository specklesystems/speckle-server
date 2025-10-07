import { err, ok } from 'true-myth/result'
import {
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError,
  ProjectNotFoundError,
  SavedViewInvalidUpdateError,
  SavedViewNoAccessError,
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
import {
  MaybeUserContext,
  ProjectContext,
  SavedViewContext
} from '../../../domain/context.js'
import { Loaders } from '../../../domain/loaders.js'
import { AuthPolicy } from '../../../domain/policies.js'
import {
  ensureCanAccessSavedViewFragment,
  WriteTypes
} from '../../../fragments/savedViews.js'
import { SavedViewVisibility } from '../../../domain/savedViews/types.js'
import { isModelResource, resourceBuilder } from '../../../../viewer/helpers/route.js'

export const canSetSavedViewAsHomeViewPolicy: AuthPolicy<
  | typeof Loaders.getSavedView
  | typeof Loaders.getProject
  | typeof Loaders.getEnv
  | typeof Loaders.getServerRole
  | typeof Loaders.getWorkspaceRole
  | typeof Loaders.getWorkspace
  | typeof Loaders.getWorkspacePlan
  | typeof Loaders.getWorkspaceSsoProvider
  | typeof Loaders.getWorkspaceSsoSession
  | typeof Loaders.getAdminOverrideEnabled
  | typeof Loaders.getProjectRole,
  MaybeUserContext & ProjectContext & SavedViewContext,
  InstanceType<
    | typeof SavedViewNotFoundError
    | typeof SavedViewNoAccessError
    | typeof ProjectNotFoundError
    | typeof ServerNoAccessError
    | typeof ServerNoSessionError
    | typeof ProjectNoAccessError
    | typeof WorkspaceNoAccessError
    | typeof WorkspaceSsoSessionNoAccessError
    | typeof ServerNotEnoughPermissionsError
    | typeof ProjectNotEnoughPermissionsError
    | typeof WorkspaceNotEnoughPermissionsError
    | typeof WorkspacesNotEnabledError
    | typeof WorkspaceReadOnlyError
    | typeof WorkspacePlanNoFeatureAccessError
    | typeof SavedViewInvalidUpdateError
  >
> =
  (loaders) =>
  async ({ userId, projectId, savedViewId }) => {
    const canDoUpdate = await ensureCanAccessSavedViewFragment(loaders)({
      userId,
      projectId,
      savedViewId,
      access: WriteTypes.SetHomeView
    })
    if (canDoUpdate.isErr) {
      return err(canDoUpdate.error)
    }

    const view = await loaders.getSavedView({
      projectId,
      savedViewId
    })
    if (!view) return err(new SavedViewNotFoundError())

    // Must be a shared view to be set as home view
    const isAuthorOnly = view.visibility === SavedViewVisibility.authorOnly
    if (isAuthorOnly) {
      return err(
        new SavedViewInvalidUpdateError({
          message: 'A view must be shared to be set as a home view'
        })
      )
    }

    // Must not be federated
    const resourceIds = resourceBuilder().addResources(view.resourceIds)
    const firstResource = resourceIds.toResources().at(0)
    const modelResource =
      firstResource && isModelResource(firstResource) ? firstResource : undefined

    const isSingleModelView = resourceIds.length === 1 && modelResource
    if (!isSingleModelView) {
      return err(
        new SavedViewInvalidUpdateError({
          message: 'Only single model views can be set as home views'
        })
      )
    }

    return ok()
  }
