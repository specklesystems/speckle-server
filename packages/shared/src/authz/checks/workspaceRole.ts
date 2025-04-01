import { WorkspaceRoles } from '../../core/constants.js'
import { throwUncoveredError } from '../../core/index.js'
import { isMinimumWorkspaceRole } from '../domain/logic/roles.js'
import { AuthPolicyCheck } from '../domain/policies.js'

export const requireMinimumWorkspaceRole: AuthPolicyCheck<
  'getWorkspaceRole',
  { userId: string; workspaceId: string; role: WorkspaceRoles }
> =
  (loaders) =>
  async ({ userId, workspaceId, role: requiredWorkspaceRole }) => {
    const userWorkspaceRole = await loaders.getWorkspaceRole({ userId, workspaceId })
    if (userWorkspaceRole.isErr) {
      switch (userWorkspaceRole.error.code) {
        case 'WorkspaceRoleNotFound':
          return false
        default:
          throwUncoveredError(userWorkspaceRole.error.code)
      }
    }

    return isMinimumWorkspaceRole(userWorkspaceRole.value, requiredWorkspaceRole)
  }

export const hasAnyWorkspaceRole: AuthPolicyCheck<
  'getWorkspaceRole',
  { userId: string; workspaceId: string }
> =
  (loaders) =>
  async ({ userId, workspaceId }) => {
    const userWorkspaceRole = await loaders.getWorkspaceRole({ userId, workspaceId })
    if (userWorkspaceRole.isOk) return true
    switch (userWorkspaceRole.error.code) {
      case 'WorkspaceRoleNotFound':
        return false
      default:
        throwUncoveredError(userWorkspaceRole.error.code)
    }
  }
