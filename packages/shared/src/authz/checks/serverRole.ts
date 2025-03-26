import { ServerRoles } from '../../core/constants.js'
import { AuthCheckContext, AuthCheckContextLoaderKeys } from '../domain/loaders.js'

export const requireExactServerRole =
  ({ loaders }: AuthCheckContext<typeof AuthCheckContextLoaderKeys.getServerRole>) =>
  async (args: { userId: string; role: ServerRoles }): Promise<boolean> => {
    const { userId, role: requiredServerRole } = args

    const userServerRole = await loaders.getServerRole({ userId })
    if (!userServerRole.isOk) return false

    return userServerRole.value === requiredServerRole
  }
