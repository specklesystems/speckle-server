import { err, ok } from 'true-myth/result'
import { AuthPolicyEnsureFragment } from '../domain/policies.js'
import { hasMinimumWorkspaceRole } from '../checks/workspaceRole.js'
import {
  WorkspaceNoAccessError,
  WorkspacesNotEnabledError,
  WorkspaceSsoSessionNoAccessError
} from '../domain/authErrors.js'
import { Loaders } from '../domain/loaders.js'
import { Roles, WorkspaceRoles } from '../../core/constants.js'

/**
 * Ensure user has a workspace role, and a valid SSO session (if SSO is configured)
 */
export const ensureWorkspaceRoleAndSessionFragment: AuthPolicyEnsureFragment<
  | 'getWorkspaceRole'
  | 'getWorkspaceSsoProvider'
  | 'getWorkspaceSsoSession'
  | 'getWorkspace',
  { userId: string; workspaceId: string; role?: WorkspaceRoles },
  InstanceType<typeof WorkspaceSsoSessionNoAccessError | typeof WorkspaceNoAccessError>
> =
  (loaders) =>
  async ({ userId, workspaceId, role }) => {
    // Get workspace, so we can resolve its slug for error scenarios
    const workspace = await loaders.getWorkspace({ workspaceId })
    // hides the fact, that the workspace does not exist
    if (!workspace) return err(new WorkspaceNoAccessError())

    const hasMinimumRole = await hasMinimumWorkspaceRole(loaders)({
      userId,
      workspaceId,
      role: role ?? Roles.Workspace.Guest
    })
    if (!hasMinimumRole) return err(new WorkspaceNoAccessError())

    const hasMinimumMemberRole = await hasMinimumWorkspaceRole(loaders)({
      userId,
      workspaceId,
      role: 'workspace:member'
    })
    // only members and above need to use sso
    if (!hasMinimumMemberRole) return ok()

    const workspaceSsoProvider = await loaders.getWorkspaceSsoProvider({
      workspaceId
    })
    if (!workspaceSsoProvider) return ok()

    const workspaceSsoSession = await loaders.getWorkspaceSsoSession({
      userId,
      workspaceId
    })
    if (!workspaceSsoSession)
      return err(
        new WorkspaceSsoSessionNoAccessError({
          payload: { workspaceSlug: workspace.slug }
        })
      )

    const isExpiredSession =
      new Date().getTime() > workspaceSsoSession.validUntil.getTime()

    if (isExpiredSession)
      return err(
        new WorkspaceSsoSessionNoAccessError({
          payload: { workspaceSlug: workspace.slug }
        })
      )

    return ok()
  }

/**
 * Ensure the workspaces module is enabled
 */
export const ensureWorkspacesEnabledFragment: AuthPolicyEnsureFragment<
  typeof Loaders.getEnv,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  {},
  InstanceType<typeof WorkspacesNotEnabledError>
> = (loaders) => async () => {
  const env = await loaders.getEnv()
  if (!env.FF_WORKSPACES_MODULE_ENABLED) return err(new WorkspacesNotEnabledError())
  return ok()
}
