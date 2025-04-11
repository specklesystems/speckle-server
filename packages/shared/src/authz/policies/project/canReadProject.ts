import { Roles } from '../../../core/constants.js'
import { err, ok } from 'true-myth/result'
import { AuthPolicy } from '../../domain/policies.js'
import { MaybeUserContext, ProjectContext } from '../../domain/context.js'
import {
  checkIfPubliclyReadableProjectFragment,
  ensureMinimumProjectRoleFragment,
  ensureProjectWorkspaceAccessFragment
} from '../../fragments/projects.js'
import {
  checkIfAdminOverrideEnabledFragment,
  ensureMinimumServerRoleFragment
} from '../../fragments/server.js'
import { Loaders } from '../../domain/loaders.js'
import {
  ProjectNoAccessError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceNoAccessError,
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
    | typeof ProjectNoAccessError
    | typeof WorkspaceNoAccessError
    | typeof WorkspaceSsoSessionNoAccessError
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

    // Not public. Ensure user is authed
    const ensuredServerRole = await ensureMinimumServerRoleFragment(loaders)({
      userId,
      role: Roles.Server.Guest
    })
    if (ensuredServerRole.isErr) {
      return err(ensuredServerRole.error)
    }

    // Check if user has admin override enabled
    const isAdminOverrideEnabled = await checkIfAdminOverrideEnabledFragment(loaders)({
      userId
    })
    if (isAdminOverrideEnabled.isErr) {
      return err(isAdminOverrideEnabled.error)
    }
    if (isAdminOverrideEnabled.value) return ok()

    // No god mode, ensure workspace access
    const ensuredWorkspaceAccess = await ensureProjectWorkspaceAccessFragment(loaders)({
      userId: userId!,
      projectId
    })
    if (ensuredWorkspaceAccess.isErr) {
      return err(ensuredWorkspaceAccess.error)
    }

    // And ensure (implicit/explicit) project role
    const ensuredProjectRole = await ensureMinimumProjectRoleFragment(loaders)({
      userId: userId!,
      projectId
    })
    if (ensuredProjectRole.isErr) {
      return err(ensuredProjectRole.error)
    }

    return ok()
  }
