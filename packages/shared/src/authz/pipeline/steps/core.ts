import { GetServerRole } from '../../domain/core/operations.js'
import { ServerRole } from '../../domain/core/types.js'
import { AuthFunction } from '../../domain/types.js'

export const requireExactServerRole =
  (
    context: {
      role: ServerRole
    },
    deps: {
      getServerRole: GetServerRole
    }
  ): AuthFunction =>
  async ({ userId }) => {
    const userServerRole = await deps.getServerRole({ userId })
    const requiredServerRole = context.role

    return userServerRole === requiredServerRole
      ? {
          authorized: true
        }
      : {
          authorized: false,
          reason: `User does not have required server role \`${requiredServerRole}\``
        }
  }
