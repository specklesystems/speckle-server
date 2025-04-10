import { err, ok } from 'true-myth/result'
import { MaybeUserContext, ProjectContext } from '../../domain/context.js'
import { AuthCheckContextLoaderKeys } from '../../domain/loaders.js'
import { AuthPolicy } from '../../domain/policies.js'
import { ensureWorkspacesEnabledFragment } from '../../fragments/workspaces.js'
import {
  WorkspacesNotEnabledError,
  ServerNoAccessError,
  ServerNoSessionError,
  WorkspaceSsoSessionNoAccessError,
  WorkspaceNoAccessError,
  ProjectNoAccessError,
  ProjectNotFoundError
} from '../../domain/authErrors.js'
import { ensureMinimumServerRoleFragment } from '../../fragments/server.js'
import { Roles } from '../../../core/constants.js'
import { ensureMinimumProjectRoleFragment } from '../../fragments/projects.js'

type PolicyLoaderKeys =
  | typeof AuthCheckContextLoaderKeys.getEnv
  | typeof AuthCheckContextLoaderKeys.getServerRole
  | typeof AuthCheckContextLoaderKeys.getProject
  | typeof AuthCheckContextLoaderKeys.getProjectRole
  | typeof AuthCheckContextLoaderKeys.getWorkspace
  | typeof AuthCheckContextLoaderKeys.getWorkspaceRole
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSsoProvider
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSsoSession

type PolicyArgs = MaybeUserContext & ProjectContext

type PolicyErrors =
  | InstanceType<typeof WorkspacesNotEnabledError>
  | InstanceType<typeof ServerNoAccessError>
  | InstanceType<typeof ServerNoSessionError>
  | InstanceType<typeof ProjectNoAccessError>
  | InstanceType<typeof ProjectNotFoundError>
  | InstanceType<typeof WorkspaceSsoSessionNoAccessError>
  | InstanceType<typeof WorkspaceNoAccessError>

export const canInvitePolicy: AuthPolicy<PolicyLoaderKeys, PolicyArgs, PolicyErrors> =
  (loaders) =>
  async ({ userId, projectId }) => {
    const ensuredWorkspacesEnabled = await ensureWorkspacesEnabledFragment(loaders)({})
    if (ensuredWorkspacesEnabled.isErr) return err(ensuredWorkspacesEnabled.error)

    const ensuredServerRole = await ensureMinimumServerRoleFragment(loaders)({
      userId,
      role: Roles.Server.User
    })
    if (ensuredServerRole.isErr) return err(ensuredServerRole.error)

    const ensuredProjectRole = await ensureMinimumProjectRoleFragment(loaders)({
      userId: userId!,
      projectId,
      role: Roles.Stream.Owner
    })
    if (ensuredProjectRole.isErr) return err(ensuredProjectRole.error)

    return ok()
  }
