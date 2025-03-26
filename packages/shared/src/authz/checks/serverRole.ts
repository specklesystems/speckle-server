import { ServerRoles } from '../../core/constants.js'
import { isMinimumServerRole } from '../domain/core/logic.js'
import { AuthCheckContext, AuthCheckContextLoaderKeys } from '../domain/loaders.js'

export const requireExactServerRole =
  ({ loaders }: AuthCheckContext<typeof AuthCheckContextLoaderKeys.getServerRole>) =>
  async (args: { userId: string; role: ServerRoles }): Promise<boolean> => {
    const { userId, role: requiredServerRole } = args

    const userServerRole = await loaders.getServerRole({ userId })
    if (!userServerRole.isOk) return false

    return userServerRole.value === requiredServerRole
  }

export const requireMinimumServerRoleFactory =
  ({ loaders }: AuthCheckContext<'getServerRole'>) =>
  async (args: { userId: string; role: ServerRoles }): Promise<boolean> => {
    const { userId, role: minimumServerRole } = args

    const userServerRole = await loaders.getServerRole({ userId })
    if (!userServerRole.isOk) return false

    return userServerRole
      ? isMinimumServerRole(userServerRole.value, minimumServerRole)
      : false
  }
