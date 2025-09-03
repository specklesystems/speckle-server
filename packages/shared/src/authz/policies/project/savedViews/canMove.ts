import {
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError,
  ProjectNotFoundError,
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

export const canMoveSavedViewPolicy: AuthPolicy<
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
  >
> =
  (loaders) =>
  async ({ userId, projectId, savedViewId }) => {
    return await ensureCanAccessSavedViewFragment(loaders)({
      userId,
      projectId,
      savedViewId,
      access: WriteTypes.MoveView
    })
  }
