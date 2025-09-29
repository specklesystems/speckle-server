import { Roles } from '../../../../core/constants.js'
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
import {
  MaybeUserContext,
  ProjectContext,
  SavedViewGroupContext
} from '../../../domain/context.js'
import { Loaders } from '../../../domain/loaders.js'
import { AuthPolicy } from '../../../domain/policies.js'
import {
  ensureImplicitProjectMemberWithWriteAccessFragment,
  ensureMinimumProjectRoleFragment
} from '../../../fragments/projects.js'
import { ensureCanAccessSavedViewGroupFragment } from '../../../fragments/savedViews.js'
import { err, ok } from 'true-myth/result'

export const canCreateSavedViewGroupTokenPolicy: AuthPolicy<
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
  MaybeUserContext & ProjectContext & SavedViewGroupContext,
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
  async ({ userId, projectId, savedViewGroupId }) => {
    const canUseSavedViews = await ensureCanAccessSavedViewGroupFragment(loaders)({
      userId,
      projectId,
      savedViewGroupId,
      access: 'write'
    })

    if (canUseSavedViews.isErr) return err(canUseSavedViews.error)

    const env = await loaders.getEnv()
    const project = await loaders.getProject({ projectId })

    if (!!project?.workspaceId && env.FF_WORKSPACES_MODULE_ENABLED) {
      // Ensure owner-level access and valid plan
      const ensuredProjectRole =
        await ensureImplicitProjectMemberWithWriteAccessFragment(loaders)({
          userId,
          projectId,
          role: Roles.Stream.Owner
        })
      if (ensuredProjectRole.isErr) {
        return err(ensuredProjectRole.error)
      }

      const plan = await loaders.getWorkspacePlan({ workspaceId: project.workspaceId })

      switch (plan?.name) {
        case 'academia':
        case 'enterprise':
        case 'pro':
        case 'proUnlimited':
        case 'proUnlimitedInvoiced':
        case 'team':
        case 'teamUnlimited':
        case 'teamUnlimitedInvoiced':
        case 'unlimited':
          return ok()
        case 'free':
        default:
          return err(new WorkspacePlanNoFeatureAccessError())
      }
    } else {
      // Ensure project owner
      const isProjectOwner = await ensureMinimumProjectRoleFragment(loaders)({
        userId: userId!,
        projectId,
        role: Roles.Stream.Owner
      })
      if (isProjectOwner.isErr) {
        return err(isProjectOwner.error)
      }

      return ok()
    }
  }
