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
} from '../../domain/authErrors.js'
import {
  MaybeUserContext,
  ProjectContext,
  WorkspaceContext
} from '../../domain/context.js'
import { Loaders } from '../../domain/loaders.js'
import { AuthPolicy } from '../../domain/policies.js'
import { ensureMinimumServerRoleFragment } from '../../fragments/server.js'
import { canReadProjectPolicy } from '../project/canRead.js'
import { ensureWorkspaceRoleAndSessionFragment } from '../../fragments/workspaces.js'
import { Roles } from '../../../core/constants.js'

/**
 * Whether the user can receive "workspace's projects updated" subscription messages about this project
 */
export const canReceiveWorkspaceProjectsUpdatedMessagePolicy: AuthPolicy<
  | typeof Loaders.getProject
  | typeof Loaders.getEnv
  | typeof Loaders.getServerRole
  | typeof Loaders.getWorkspaceRole
  | typeof Loaders.getWorkspace
  | typeof Loaders.getWorkspaceSsoProvider
  | typeof Loaders.getWorkspaceSsoSession
  | typeof Loaders.getProjectRole
  | typeof Loaders.getAdminOverrideEnabled,
  MaybeUserContext & ProjectContext & WorkspaceContext,
  InstanceType<
    | typeof ProjectNotFoundError
    | typeof ServerNoAccessError
    | typeof ServerNoSessionError
    | typeof ServerNotEnoughPermissionsError
    | typeof ProjectNoAccessError
    | typeof WorkspaceNoAccessError
    | typeof WorkspaceSsoSessionNoAccessError
    | typeof WorkspaceNotEnoughPermissionsError
    | typeof ProjectNotEnoughPermissionsError
  >
> =
  (loaders) =>
  async ({ userId, projectId, workspaceId }) => {
    // User must be logged in
    const ensuredLoggedIn = await ensureMinimumServerRoleFragment(loaders)({
      userId
    })
    if (ensuredLoggedIn.isErr) {
      return err(ensuredLoggedIn.error)
    }

    // User must be a workspace member
    const ensureWorkspaceAccess = await ensureWorkspaceRoleAndSessionFragment(loaders)({
      userId: userId!,
      workspaceId
    })
    if (ensureWorkspaceAccess.isErr) {
      return err(ensureWorkspaceAccess.error)
    }

    // Check if project still exists (may have just been deleted)
    const project = await loaders.getProject({ projectId })
    if (!project) {
      // If it no longer exists, let's just allow the update as it can't really leak anything
      // besides that the project no longer exists, cause there is no way to properly check permissions anymore.
      return ok()
    }

    // Implicit canRead check
    const canRead = await canReadProjectPolicy(loaders)({
      userId,
      projectId
    })
    if (canRead.isErr) {
      return err(canRead.error)
    }

    // If guest - user must be an explicit project member, regardless if they can read the project or not
    const [workspaceRole, projectRole] = await Promise.all([
      loaders.getWorkspaceRole({
        userId: userId!,
        workspaceId
      }),
      loaders.getProjectRole({
        userId: userId!,
        projectId
      })
    ])
    if (workspaceRole === Roles.Workspace.Guest && !projectRole) {
      return err(
        new ProjectNotEnoughPermissionsError(
          'You must be a project member to receive "projects updated" messages about this project'
        )
      )
    }

    return ok()
  }
