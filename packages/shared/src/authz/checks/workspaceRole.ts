import { WorkspaceRoles } from '../../core/constants.js'
import { UserContext, WorkspaceContext } from '../domain/context.js'
import { isMinimumWorkspaceRole } from '../domain/logic/roles.js'
import { AuthPolicyCheck } from '../domain/policies.js'

export const hasMinimumWorkspaceRole: AuthPolicyCheck<
  'getWorkspaceRole',
  UserContext & WorkspaceContext & { role: WorkspaceRoles }
> =
  (loaders) =>
  async ({ userId, workspaceId, role: requiredWorkspaceRole }) => {
    const userWorkspaceRole = await loaders.getWorkspaceRole({ userId, workspaceId })
    if (!userWorkspaceRole) return false

    return isMinimumWorkspaceRole(userWorkspaceRole, requiredWorkspaceRole)
  }

export const hasAnyWorkspaceRole: AuthPolicyCheck<
  'getWorkspaceRole',
  { userId: string; workspaceId: string }
> =
  (loaders) =>
  async ({ userId, workspaceId }) => {
    const userWorkspaceRole = await loaders.getWorkspaceRole({ userId, workspaceId })
    return userWorkspaceRole !== null
  }
