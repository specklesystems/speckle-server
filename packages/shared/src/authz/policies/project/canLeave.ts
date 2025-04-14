import { err, ok } from 'true-myth/result'
import { Roles } from '../../../core/constants.js'
import {
  ProjectLastOwnerError,
  ProjectNoAccessError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  WorkspaceNoAccessError,
  WorkspaceNotEnoughPermissionsError,
  WorkspaceSsoSessionNoAccessError
} from '../../domain/authErrors.js'
import { MaybeUserContext, ProjectContext } from '../../domain/context.js'
import { Loaders } from '../../domain/loaders.js'
import { AuthPolicy } from '../../domain/policies.js'
import { ensureMinimumServerRoleFragment } from '../../fragments/server.js'
import { ensureProjectWorkspaceAccessFragment } from '../../fragments/projects.js'

export const canLeaveProjectPolicy: AuthPolicy<
  | typeof Loaders.getProject
  | typeof Loaders.getServerRole
  | typeof Loaders.getEnv
  | typeof Loaders.getWorkspaceRole
  | typeof Loaders.getWorkspace
  | typeof Loaders.getWorkspaceSsoProvider
  | typeof Loaders.getWorkspaceSsoSession
  | typeof Loaders.getProjectRole
  | typeof Loaders.getProjectRoleCounts,
  ProjectContext & MaybeUserContext,
  InstanceType<
    | typeof ProjectNoAccessError
    | typeof ProjectNotFoundError
    | typeof WorkspaceNoAccessError
    | typeof ServerNoAccessError
    | typeof ServerNoSessionError
    | typeof WorkspaceSsoSessionNoAccessError
    | typeof WorkspaceNotEnoughPermissionsError
    | typeof ServerNotEnoughPermissionsError
    | typeof ProjectLastOwnerError
  >
> =
  (loaders) =>
  async ({ userId, projectId }) => {
    const ensuredServerRole = await ensureMinimumServerRoleFragment(loaders)({
      userId
    })
    if (ensuredServerRole.isErr) {
      return err(ensuredServerRole.error)
    }

    const ensuredWorkspaceAccess = await ensureProjectWorkspaceAccessFragment(loaders)({
      userId: userId!,
      projectId
    })
    if (ensuredWorkspaceAccess.isErr) {
      return err(ensuredWorkspaceAccess.error)
    }

    // Ensure user is not the last owner
    const projectRole = await loaders.getProjectRole({ projectId, userId: userId! })
    if (!projectRole) {
      return err(new ProjectNoAccessError('You must be a project member to leave'))
    }

    if (projectRole !== Roles.Stream.Owner) {
      return ok()
    }

    const ownerCounts = await loaders.getProjectRoleCounts({
      projectId,
      role: Roles.Stream.Owner
    })
    if (ownerCounts < 2) {
      return err(
        new ProjectLastOwnerError('As the last owner of the project, you cannot leave')
      )
    }

    return ok()
  }
