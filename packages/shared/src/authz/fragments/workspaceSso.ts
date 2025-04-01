import { err, ok } from 'true-myth/result'
import { AuthPolicyFragment } from '../domain/policies.js'
import {
  hasAnyWorkspaceRole,
  requireMinimumWorkspaceRole
} from '../checks/workspaceRole.js'
import { just, nothing } from 'true-myth/maybe'
import {
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError
} from '../domain/authErrors.js'

//
export const maybeMemberRoleWithValidSsoSessionIfNeeded: AuthPolicyFragment<
  | 'getWorkspaceRole'
  | 'getWorkspaceSsoProvider'
  | 'getWorkspaceSsoSession'
  | 'getWorkspace',
  { userId: string; workspaceId: string },
  InstanceType<typeof WorkspaceSsoSessionNoAccessError | typeof WorkspaceNoAccessError>
> =
  (loaders) =>
  async ({ userId, workspaceId }) => {
    // Get workspace, so we can resolve its slug for error scenarios
    const workspace = await loaders.getWorkspace({ workspaceId })
    // hides the fact, that the workspace does not exist
    if (!workspace) return just(err(new WorkspaceNoAccessError()))

    const hasAnyRole = await hasAnyWorkspaceRole(loaders)({ userId, workspaceId })
    if (!hasAnyRole) return just(err(new WorkspaceNoAccessError()))

    const hasMinimumMemberRole = await requireMinimumWorkspaceRole(loaders)({
      userId,
      workspaceId,
      role: 'workspace:member'
    })
    // only members and above need to use sso
    if (!hasMinimumMemberRole) return nothing()

    const workspaceSsoProvider = await loaders.getWorkspaceSsoProvider({
      workspaceId
    })
    if (!workspaceSsoProvider) return just(ok())

    const workspaceSsoSession = await loaders.getWorkspaceSsoSession({
      userId,
      workspaceId
    })
    if (!workspaceSsoSession)
      return just(
        err(
          new WorkspaceSsoSessionNoAccessError({
            payload: { workspaceSlug: workspace.slug }
          })
        )
      )

    const isExpiredSession =
      new Date().getTime() > workspaceSsoSession.validUntil.getTime()

    if (isExpiredSession)
      return just(
        err(
          new WorkspaceSsoSessionNoAccessError({
            payload: { workspaceSlug: workspace.slug }
          })
        )
      )
    return just(ok())
  }
