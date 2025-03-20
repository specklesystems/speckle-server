import { WorkspaceRoles } from '../../core/constants.js'
import { AuthCheckContext } from '../domain/loaders.js'
import { isMinimumWorkspaceRole } from '../domain/workspaces/logic.js'

export const requireAnyWorkspaceRole =
  ({ loaders }: AuthCheckContext<'getWorkspaceRole'>) =>
  async (args: { userId: string; workspaceId: string }): Promise<boolean> => {
    const { userId, workspaceId } = args

    const userWorkspaceRole = await loaders.getWorkspaceRole({ userId, workspaceId })

    return userWorkspaceRole !== null
  }

export const requireMinimumWorkspaceRole =
  ({ loaders }: AuthCheckContext<'getWorkspaceRole'>) =>
  async (args: {
    userId: string
    workspaceId: string
    role: WorkspaceRoles
  }): Promise<boolean> => {
    const { userId, workspaceId, role: requiredWorkspaceRole } = args

    const userWorkspaceRole = await loaders.getWorkspaceRole({ userId, workspaceId })

    return userWorkspaceRole
      ? isMinimumWorkspaceRole(userWorkspaceRole, requiredWorkspaceRole)
      : false
  }
