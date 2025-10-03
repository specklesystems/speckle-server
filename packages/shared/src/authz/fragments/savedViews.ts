import { err, ok } from 'true-myth/result'
import {
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError,
  ProjectNotFoundError,
  SavedViewGroupNotFoundError,
  SavedViewNoAccessError,
  SavedViewNotFoundError,
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
} from '../domain/authErrors.js'
import {
  MaybeUserContext,
  ProjectContext,
  SavedViewContext,
  SavedViewGroupContext
} from '../domain/context.js'
import { Loaders } from '../domain/loaders.js'
import { AuthPolicyEnsureFragment } from '../domain/policies.js'
import { SavedViewVisibility } from '../domain/savedViews/types.js'
import {
  ensureCanUseProjectWorkspacePlanFeatureFragment,
  ensureImplicitProjectMemberWithWriteAccessFragment
} from './projects.js'
import { Roles } from '../../core/constants.js'
import { WorkspacePlanFeatures } from '../../workspaces/index.js'
import { isUngroupedGroup } from '../../saved-views/index.js'
import { StringEnum, StringEnumValues, throwUncoveredError } from '../../core/index.js'

export const WriteTypes = StringEnum([
  'UpdateGeneral',
  'MoveView',
  'EditTitle',
  'EditDescription',
  'SetHomeView'
])
export type WriteTypes = StringEnumValues<typeof WriteTypes>

/**
 * Ensure the user can access the view
 */
export const ensureCanAccessSavedViewFragment: AuthPolicyEnsureFragment<
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
  MaybeUserContext &
    ProjectContext &
    SavedViewContext & {
      access: 'read' | WriteTypes
      /**
       * In some cases we want to just ignore a view being non-existant, instead of throwing
       */
      allowNonExistent?: boolean
    },
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
  async ({ userId, projectId, savedViewId, access, allowNonExistent }) => {
    const canUseSavedViews = await ensureCanUseProjectWorkspacePlanFeatureFragment(
      loaders
    )({
      projectId,
      feature: WorkspacePlanFeatures.SavedViews
    })
    if (canUseSavedViews.isErr) return err(canUseSavedViews.error)

    const savedView = await loaders.getSavedView({ projectId, savedViewId })
    if (!savedView) {
      if (allowNonExistent) return ok()
      return err(new SavedViewNotFoundError())
    }
    const isPublic = savedView.visibility === SavedViewVisibility.public
    const isAuthor = savedView.authorId === userId

    // Validate read access
    if (access === 'read') {
      if (isAuthor || isPublic) {
        return ok()
      } else {
        return err(
          new SavedViewNoAccessError({
            message: 'You do not have permission to read this saved view.'
          })
        )
      }
    }

    // Validate write access
    // Check for write access to project first
    const ensuredWriteAccess = await ensureImplicitProjectMemberWithWriteAccessFragment(
      loaders
    )({
      userId,
      projectId
    })
    if (ensuredWriteAccess.isErr) {
      if (ensuredWriteAccess.error.code === ProjectNotEnoughPermissionsError.code)
        return err(
          new ProjectNotEnoughPermissionsError({
            message:
              "Your role on this project doesn't give you permission to update views."
          })
        )
      return err(ensuredWriteAccess.error)
    }

    if (isAuthor) {
      // authors can write whatever
      return ok()
    }

    // Non-author project writers can make specific changes
    switch (access) {
      case WriteTypes.MoveView:
      case WriteTypes.EditTitle:
      case WriteTypes.EditDescription:
      case WriteTypes.SetHomeView:
        return ok()
      case WriteTypes.UpdateGeneral:
        return err(
          new SavedViewNoAccessError({
            message: 'You do not have permission to edit the view in this way'
          })
        )
      default:
        throwUncoveredError(access)
    }
  }

/**
 * Ensure the user can access the view group
 */
export const ensureCanAccessSavedViewGroupFragment: AuthPolicyEnsureFragment<
  | typeof Loaders.getSavedViewGroup
  | typeof Loaders.getProject
  | typeof Loaders.getEnv
  | typeof Loaders.getServerRole
  | typeof Loaders.getWorkspaceRole
  | typeof Loaders.getWorkspace
  | typeof Loaders.getWorkspacePlan
  | typeof Loaders.getWorkspaceSsoProvider
  | typeof Loaders.getWorkspaceSsoSession
  | typeof Loaders.getProjectRole,
  MaybeUserContext &
    ProjectContext &
    SavedViewGroupContext & {
      access: 'read' | 'write'
    },
  InstanceType<
    | typeof SavedViewGroupNotFoundError
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
    | typeof UngroupedSavedViewGroupLockError
  >
> =
  (loaders) =>
  async ({ userId, projectId, savedViewGroupId, access }) => {
    const canUseSavedViews = await ensureCanUseProjectWorkspacePlanFeatureFragment(
      loaders
    )({
      projectId,
      feature: WorkspacePlanFeatures.SavedViews
    })
    if (canUseSavedViews.isErr) return err(canUseSavedViews.error)

    const savedViewGroup = await loaders.getSavedViewGroup({
      projectId,
      groupId: savedViewGroupId
    })
    if (!savedViewGroup) return err(new SavedViewGroupNotFoundError())

    if (access === 'read') {
      return ok() // read access available to everyone who has access to project
    }

    // Prevent default group updates (as it doesnt exist)
    if (isUngroupedGroup(savedViewGroup.id)) {
      return err(new UngroupedSavedViewGroupLockError())
    }

    // groups have no visibility (yet), so authors AND project owners can mutate
    const isAuthor = savedViewGroup.authorId === userId
    const expectedProjectRole = isAuthor ? Roles.Stream.Contributor : Roles.Stream.Owner

    const ensuredWriteAccess = await ensureImplicitProjectMemberWithWriteAccessFragment(
      loaders
    )({
      userId,
      projectId,
      role: expectedProjectRole
    })
    if (ensuredWriteAccess.isErr) {
      if (ensuredWriteAccess.error.code === ProjectNotEnoughPermissionsError.code)
        return err(
          new ProjectNotEnoughPermissionsError({
            message:
              "Your role on this project doesn't give you permission to update view groups."
          })
        )
      return err(ensuredWriteAccess.error)
    }

    return ok()
  }
