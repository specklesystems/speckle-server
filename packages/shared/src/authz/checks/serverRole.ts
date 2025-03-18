import { ServerRoles } from '../../core/constants.js'
import { AuthCheckContext } from '../domain/loaders.js'

export const requireExactServerRole =
  ({ loaders }: AuthCheckContext<'getServerRole'>) =>
  async (args: { userId: string; role: ServerRoles }): Promise<boolean> => {
    const { userId, role: requiredServerRole } = args

    const userServerRole = await loaders.getServerRole({ userId })

    return userServerRole === requiredServerRole
  }
