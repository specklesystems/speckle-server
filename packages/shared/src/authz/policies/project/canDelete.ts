import { ok } from 'true-myth/result'
import { MaybeUserContext, ProjectContext } from '../../domain/context.js'
import { AuthPolicy } from '../../domain/policies.js'
import { Roles } from '../../../core/constants.js'
import { Loaders } from '../../domain/loaders.js'
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
} from '../../domain/authErrors.js'
import { ensureMinimumServerRoleFragment } from '../../fragments/server.js'
import { canUpdateProjectPolicy } from './canUpdate.js'

export const canDeleteProjectPolicy: AuthPolicy<
  | typeof Loaders.getProject
  | typeof Loaders.getServerRole
  | typeof Loaders.getEnv
  | typeof Loaders.getWorkspaceRole
  | typeof Loaders.getWorkspace
  | typeof Loaders.getWorkspaceSsoProvider
  | typeof Loaders.getWorkspaceSsoSession
  | typeof Loaders.getProjectRole,
  ProjectContext & MaybeUserContext,
  InstanceType<
    | typeof ProjectNoAccessError
    | typeof ProjectNotFoundError
    | typeof WorkspaceNoAccessError
    | typeof ServerNoAccessError
    | typeof ServerNoSessionError
    | typeof ServerNotEnoughPermissionsError
    | typeof WorkspaceSsoSessionNoAccessError
    | typeof WorkspaceNotEnoughPermissionsError
    | typeof ProjectNotEnoughPermissionsError
  >
> =
  (loaders) =>
  async ({ userId, projectId }) => {
    // Server admins can also delete projects
    const ensuredAdminAccess = await ensureMinimumServerRoleFragment(loaders)({
      userId,
      role: Roles.Server.Admin
    })
    if (ensuredAdminAccess.isOk) {
      return ok()
    }

    // Otherwise follow standard canUpdate check
    const ensuredCanUpdate = await canUpdateProjectPolicy(loaders)({
      userId,
      projectId
    })

    return ensuredCanUpdate
  }
