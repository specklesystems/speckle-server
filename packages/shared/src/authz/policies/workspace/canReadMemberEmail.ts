import { err, ok } from 'true-myth/result'
import { MaybeUserContext, WorkspaceContext } from '../../domain/context.js'
import { AuthCheckContextLoaderKeys } from '../../domain/loaders.js'
import { AuthPolicy } from '../../domain/policies.js'
import {
  ensureWorkspaceRoleAndSessionFragment,
  ensureWorkspacesEnabledFragment
} from '../../fragments/workspaces.js'
import {
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  WorkspaceNoAccessError,
  WorkspaceNotEnoughPermissionsError,
  WorkspacesNotEnabledError,
  WorkspaceSsoSessionNoAccessError
} from '../../domain/authErrors.js'
import { ensureMinimumServerRoleFragment } from '../../fragments/server.js'
import { Roles } from '../../../core/constants.js'

type PolicyArgs = MaybeUserContext & WorkspaceContext

type PolicyLoaderKeys =
  | typeof AuthCheckContextLoaderKeys.getEnv
  | typeof AuthCheckContextLoaderKeys.getServerRole
  | typeof AuthCheckContextLoaderKeys.getWorkspace
  | typeof AuthCheckContextLoaderKeys.getWorkspaceRole
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSsoProvider
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSsoSession
  | typeof AuthCheckContextLoaderKeys.getWorkspacePlan

type PolicyErrors =
  | InstanceType<typeof WorkspaceNoAccessError>
  | InstanceType<typeof WorkspaceSsoSessionNoAccessError>
  | InstanceType<typeof WorkspacesNotEnabledError>
  | InstanceType<typeof ServerNoSessionError>
  | InstanceType<typeof ServerNoAccessError>
  | InstanceType<typeof ServerNotEnoughPermissionsError>
  | InstanceType<typeof WorkspaceNotEnoughPermissionsError>

export const canReadMemberEmailPolicy: AuthPolicy<
  PolicyLoaderKeys,
  PolicyArgs,
  PolicyErrors
> =
  (loaders) =>
  async ({ userId, workspaceId }) => {
    const ensuredWorkspacesEnabled = await ensureWorkspacesEnabledFragment(loaders)({})
    if (ensuredWorkspacesEnabled.isErr) return err(ensuredWorkspacesEnabled.error)

    const ensuredServerRole = await ensureMinimumServerRoleFragment(loaders)({
      userId,
      role: Roles.Server.User
    })

    if (ensuredServerRole.isErr) return err(ensuredServerRole.error)

    const ensuredWorkspaceAccess = await ensureWorkspaceRoleAndSessionFragment(loaders)(
      {
        userId: userId!,
        workspaceId,
        role: Roles.Workspace.Admin
      }
    )
    if (ensuredWorkspaceAccess.isErr) return err(ensuredWorkspaceAccess.error)
    return ok()
  }
