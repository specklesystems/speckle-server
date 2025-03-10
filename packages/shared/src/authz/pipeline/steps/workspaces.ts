import { AuthFunction } from '../../domain/types.js'
import { isMinimumWorkspaceRole } from '../../domain/workspaces/logic.js'
import { GetWorkspaceRole } from '../../domain/workspaces/operations.js'
import { WorkspaceRole } from '../../domain/workspaces/types.js'

export const requireAnyWorkspaceRole =
  (
    context: {
      workspaceId: string
    },
    deps: {
      getWorkspaceRole: GetWorkspaceRole
    }
  ): AuthFunction =>
  async ({ userId }) => {
    const { workspaceId } = context

    const userWorkspaceRole = await deps.getWorkspaceRole({ userId, workspaceId })

    return userWorkspaceRole === null
      ? {
          authorized: false,
          reason: `User does not have role in workspace \`${workspaceId}\``
        }
      : { authorized: true }
  }

export const requireMinimumWorkspaceRole =
  (
    context: {
      workspaceId: string
      role: WorkspaceRole
    },
    deps: {
      getWorkspaceRole: GetWorkspaceRole
    }
  ): AuthFunction =>
  async ({ userId }) => {
    const { workspaceId, role: requiredWorkspaceRole } = context

    const userWorkspaceRole = await deps.getWorkspaceRole({ userId, workspaceId })

    if (!userWorkspaceRole) {
      return {
        authorized: false,
        reason: `User does not have role in workspace \`${workspaceId}\``
      }
    }

    return isMinimumWorkspaceRole(userWorkspaceRole, requiredWorkspaceRole)
      ? {
          authorized: true
        }
      : {
          authorized: false,
          reason: `User does not have minimum role \`${requiredWorkspaceRole}\` in workspace \`${workspaceId}\``
        }
  }
