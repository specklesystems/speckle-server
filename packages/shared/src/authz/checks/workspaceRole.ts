import { ChuckContextLoaders } from "../domain/loaders.js"
import { AuthFunction } from "../domain/types.js"

export const requireAnyWorkspaceRole =
  ({
    context: {
      workspaceId: string
    },
    deps: Pick<ChuckContextLoaders, 'getWorkspaceRole'>
  }): AuthFunction =>
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

export const requireExactWorkspaceRole =
  (
    context: {
      workspaceId: string
      role: WorkspaceRole
    },
    deps: {
      getWorkspaceRole: GetWorkspaceRole
    }
  ): AuthFunctionWrapper =>
    async ({ userId }) => {
      const { workspaceId, role: requiredWorkspaceRole } = context

      const userWorkspaceRole = await deps.getWorkspaceRole({ userId, workspaceId })

      return userWorkspaceRole === requiredWorkspaceRole
        ? { authorized: true }
        : {
          authorized: false,
          reason: `User does not have role \`${requiredWorkspaceRole}\` in workspace \`${workspaceId}\``
        }
    }

export const requireMinimumWorkspaceRole =
  (context: { workspaceId: string; role: WorkspaceRole }, deps: { getWorkspaceRole: GetWorkspaceRole }): AuthFunction =>
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