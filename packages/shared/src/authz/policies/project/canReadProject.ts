import { err, ok } from 'true-myth/result'
import { AuthPolicy } from '../../domain/policies.js'
import { MaybeUserContext, ProjectContext } from '../../domain/context.js'
import {
  checkIfPubliclyReadableProjectFragment,
  ensureImplicitProjectMemberWithReadAccessFragment
} from '../../fragments/projects.js'
import {} from '../../fragments/server.js'
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

export const canReadProjectPolicy: AuthPolicy<
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
    | typeof ServerNotEnoughPermissionsError
    | typeof ProjectNoAccessError
    | typeof WorkspaceNoAccessError
    | typeof WorkspaceSsoSessionNoAccessError
    | typeof WorkspaceNotEnoughPermissionsError
    | typeof ProjectNotEnoughPermissionsError
  >
> =
  (loaders) =>
  async ({ userId, projectId }) => {
    // All users may read public projects
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
