import { ChuckContext } from '../domain/loaders.js'
import { CheckResult } from '../domain/types.js'
import { isMinimumWorkspaceRole } from '../domain/workspaces/logic.js'
import { WorkspaceRole } from '../domain/workspaces/types.js'
import { checkResult } from '../helpers/result.js'

export const requireAnyWorkspaceRole =
  ({ loaders }: ChuckContext<'getWorkspaceRole'>) =>
  async (args: { userId: string; workspaceId: string }): Promise<CheckResult> => {
    const { userId, workspaceId } = args

    const userWorkspaceRole = await loaders.getWorkspaceRole({ userId, workspaceId })

    return userWorkspaceRole === null
      ? checkResult.pass()
      : checkResult.fail(`User does not have role in workspace \`${workspaceId}\``)
  }

export const requireExactWorkspaceRole =
  ({ loaders }: ChuckContext<'getWorkspaceRole'>) =>
  async (args: {
    userId: string
    workspaceId: string
    role: WorkspaceRole
  }): Promise<CheckResult> => {
    const { userId, workspaceId, role: requiredWorkspaceRole } = args

    const userWorkspaceRole = await loaders.getWorkspaceRole({ userId, workspaceId })

    return userWorkspaceRole === requiredWorkspaceRole
      ? checkResult.pass()
      : checkResult.fail(
          `User does not have role \`${requiredWorkspaceRole}\` in workspace \`${workspaceId}\``
        )
  }

export const requireMinimumWorkspaceRole =
  ({ loaders }: ChuckContext<'getWorkspaceRole'>) =>
  async (args: {
    userId: string
    workspaceId: string
    role: WorkspaceRole
  }): Promise<CheckResult> => {
    const { userId, workspaceId, role: requiredWorkspaceRole } = args

    const userWorkspaceRole = await loaders.getWorkspaceRole({ userId, workspaceId })

    if (!userWorkspaceRole)
      return checkResult.fail(`User does not have role in workspace \`${workspaceId}\``)

    return isMinimumWorkspaceRole(userWorkspaceRole, requiredWorkspaceRole)
      ? checkResult.pass()
      : checkResult.fail(
          `User does not have minimum role \`${requiredWorkspaceRole}\` in workspace \`${workspaceId}\``
        )
  }
