import { err, ok } from 'true-myth/result'
import {
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  WorkspaceNoAccessError,
  WorkspaceNotEnoughPermissionsError,
  WorkspaceSsoSessionNoAccessError
} from '../../../domain/authErrors.js'
import { MaybeUserContext, ProjectContext } from '../../../domain/context.js'
import { Loaders } from '../../../domain/loaders.js'
import { AuthPolicy } from '../../../domain/policies.js'
import { ensureImplicitProjectMemberWithWriteAccessFragment } from '../../../fragments/projects.js'
import { Roles } from '../../../../core/constants.js'

export const canReceiveProjectVersionPolicy: AuthPolicy<
  | typeof Loaders.getProject
  | typeof Loaders.getEnv
  | typeof Loaders.getServerRole
  | typeof Loaders.getWorkspaceRole
  | typeof Loaders.getWorkspace
  | typeof Loaders.getWorkspaceSsoProvider
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
    | typeof WorkspaceNotEnoughPermissionsError
    | typeof ProjectNotEnoughPermissionsError
    | typeof ServerNotEnoughPermissionsError
  >
> =
  (loaders) =>
  async ({ userId, projectId }) => {
    // Ensure user has at least implicit membership & write access
    const hasWriteAccess = await ensureImplicitProjectMemberWithWriteAccessFragment(
      loaders
    )({
      userId,
      projectId,
      role: Roles.Stream.Reviewer
    })
    if (hasWriteAccess.isErr) {
      return err(hasWriteAccess.error)
    }

    return ok()
  }
