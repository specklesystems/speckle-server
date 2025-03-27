import { err, isErr, ok } from 'true-myth/result'
import { throwUncoveredError } from '../../core/helpers/error.js'
import { AuthPolicyFragment } from '../domain/policies.js'
import { requireMinimumWorkspaceRole } from '../checks/workspaceRole.js'
import { just, nothing } from 'true-myth/maybe'
import {
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError
} from '../domain/authErrors.js'

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
    const hasMinimumMemberRole = await requireMinimumWorkspaceRole(loaders)({
      userId,
      workspaceId,
      role: 'workspace:member'
    })

    if (!hasMinimumMemberRole) return nothing()

    // Get workspace, so we can resolve its slug for error scenarios
    const workspace = await loaders.getWorkspace({ workspaceId })
    if (!workspace.isOk) {
      return just(err(new WorkspaceNoAccessError()))
    }

    const workspaceSsoProvider = await loaders.getWorkspaceSsoProvider({
      workspaceId
    })
    if (isErr(workspaceSsoProvider)) {
      switch (workspaceSsoProvider.error.code) {
        case 'WorkspaceSsoProviderNotFound':
          // if there is no SSO provider, we can early return here
          return just(ok())
        default:
          throwUncoveredError(workspaceSsoProvider.error.code)
      }
    }

    const workspaceSsoSession = await loaders.getWorkspaceSsoSession({
      userId,
      workspaceId
    })
    if (isErr(workspaceSsoSession)) {
      switch (workspaceSsoSession.error.code) {
        case 'WorkspaceSsoSessionNotFound':
          return just(
            err(
              new WorkspaceSsoSessionNoAccessError({
                payload: { workspaceSlug: workspace.value.slug }
              })
            )
          )
        default:
          throwUncoveredError(workspaceSsoSession.error.code)
      }
    }

    const isExpiredSession =
      new Date().getTime() > workspaceSsoSession.value.validUntil.getTime()

    if (isExpiredSession)
      return just(
        err(
          new WorkspaceSsoSessionNoAccessError({
            payload: { workspaceSlug: workspace.value.slug }
          })
        )
      )
    return just(ok())
  }
