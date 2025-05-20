import { AuthPolicy } from '../../domain/policies.js'
import {
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  WorkspaceLimitsReachedError,
  WorkspaceNoAccessError,
  WorkspaceNoEditorSeatError,
  WorkspaceNotEnoughPermissionsError,
  WorkspaceReadOnlyError,
  WorkspacesNotEnabledError,
  WorkspaceSsoSessionNoAccessError
} from '../../domain/authErrors.js'
import { err, ok } from 'true-myth/result'
import { Roles } from '../../../core/constants.js'
import {
  ensureWorkspaceProjectCanBeCreatedFragment,
  ensureWorkspaceRoleAndSessionFragment,
  ensureWorkspacesEnabledFragment
} from '../../fragments/workspaces.js'
import { MaybeUserContext, WorkspaceContext } from '../../domain/context.js'
import { ensureMinimumServerRoleFragment } from '../../fragments/server.js'

export const canCreateWorkspaceProjectPolicy: AuthPolicy<
  | 'getEnv'
  | 'getServerRole'
  | 'getWorkspace'
  | 'getWorkspaceRole'
  | 'getWorkspaceSeat'
  | 'getWorkspacePlan'
  | 'getWorkspaceLimits'
  | 'getWorkspaceProjectCount'
  | 'getWorkspaceSsoProvider'
  | 'getWorkspaceSsoSession',
  MaybeUserContext & WorkspaceContext,
  | InstanceType<typeof WorkspacesNotEnabledError>
  | InstanceType<typeof WorkspaceNoAccessError>
  | InstanceType<typeof WorkspaceReadOnlyError>
  | InstanceType<typeof WorkspaceNoEditorSeatError>
  | InstanceType<typeof WorkspaceNotEnoughPermissionsError>
  | InstanceType<typeof WorkspaceSsoSessionNoAccessError>
  | InstanceType<typeof WorkspaceLimitsReachedError>
  | InstanceType<typeof ServerNoSessionError>
  | InstanceType<typeof ServerNoAccessError>
  | InstanceType<typeof ServerNotEnoughPermissionsError>
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
        workspaceId
      }
    )
    if (ensuredWorkspaceAccess.isErr) {
      return err(ensuredWorkspaceAccess.error)
    }

    // Ensure workspace accepts new projects
    const ensuredProjectsAccepted = await ensureWorkspaceProjectCanBeCreatedFragment(
      loaders
    )({
      workspaceId,
      userId
    })
    if (ensuredProjectsAccepted.isErr) {
      return err(ensuredProjectsAccepted.error)
    }

    return ok()
  }
