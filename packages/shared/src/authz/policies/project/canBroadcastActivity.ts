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
import { MaybeUserContext, ProjectContext } from '../../domain/context.js'
import { Loaders } from '../../domain/loaders.js'
import { AuthPolicy } from '../../domain/policies.js'
import {
  checkIfPubliclyReadableProjectFragment,
  ensureImplicitProjectMemberWithReadAccessFragment
} from '../../fragments/projects.js'
import { ensureMinimumServerRoleFragment } from '../../fragments/server.js'

export const canBroadcastProjectActivityPolicy: AuthPolicy<
  | typeof Loaders.getProject
  | typeof Loaders.getEnv
  | typeof Loaders.getServerRole
  | typeof Loaders.getWorkspaceRole
  | typeof Loaders.getWorkspace
  | typeof Loaders.getWorkspaceSsoProvider
  | typeof Loaders.getWorkspaceSsoSession
  | typeof Loaders.getProjectRole
  | typeof Loaders.getAdminOverrideEnabled,
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
    // Ensure logged in
    const ensuredServerRole = await ensureMinimumServerRoleFragment(loaders)({
      userId
    })
    if (ensuredServerRole.isErr) {
      return err(ensuredServerRole.error)
    }

    // If publicly readable - any authed user can broadcast
    const isPubliclyReadable = await checkIfPubliclyReadableProjectFragment(loaders)({
      projectId
    })
    if (isPubliclyReadable.isErr) {
      return err(isPubliclyReadable.error)
    }
    if (isPubliclyReadable.value) return ok()

    // Not public. Ensure user has at least implicit membership & read access
    const hasReadAccess = await ensureImplicitProjectMemberWithReadAccessFragment(
      loaders
    )({
      userId,
      projectId
    })
    if (hasReadAccess.isErr) {
      return err(hasReadAccess.error)
    }

    return ok()
  }
