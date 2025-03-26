import { WorkspaceRoles } from '../../core/constants.js'
import { AuthCheckContext, AuthCheckContextLoaderKeys } from '../domain/loaders.js'
import { isMinimumWorkspaceRole } from '../domain/workspaces/logic.js'

export const requireAnyWorkspaceRole =
  ({ loaders }: AuthCheckContext<typeof AuthCheckContextLoaderKeys.getWorkspaceRole>) =>
  async (args: { userId: string; workspaceId: string }): Promise<boolean> => {
    const { userId, workspaceId } = args

    const userWorkspaceRole = await loaders.getWorkspaceRole({ userId, workspaceId })
    return userWorkspaceRole.isOk
  }

export const requireMinimumWorkspaceRole =
  ({ loaders }: AuthCheckContext<typeof AuthCheckContextLoaderKeys.getWorkspaceRole>) =>
  async (args: {
    userId: string
    workspaceId: string
    role: WorkspaceRoles
  }): Promise<boolean> => {
    const { userId, workspaceId, role: requiredWorkspaceRole } = args

    const userWorkspaceRole = await loaders.getWorkspaceRole({ userId, workspaceId })

    return userWorkspaceRole.isOk
      ? isMinimumWorkspaceRole(userWorkspaceRole.value, requiredWorkspaceRole)
      : false
  }
