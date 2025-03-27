import { Roles, ServerRoles } from '../../core/constants.js'
import { throwUncoveredError } from '../../core/index.js'
import { isMinimumServerRole } from '../domain/logic/roles.js'
import { AuthPolicyCheck } from '../domain/policies.js'

export const hasMinimumServerRole: AuthPolicyCheck<
  'getServerRole',
  { userId: string; role: ServerRoles }
> =
  (loaders) =>
  async ({ userId, role: requiredServerRole }) => {
    const userServerRole = await loaders.getServerRole({ userId })
    if (userServerRole.isErr) {
      switch (userServerRole.error.code) {
        case 'ServerRoleNotFound':
          return false
        default:
          throwUncoveredError(userServerRole.error.code)
      }
    }
    return isMinimumServerRole(userServerRole.value, requiredServerRole)
  }

export const canUseAdminOverride: AuthPolicyCheck<
  'getEnv' | 'getServerRole',
  { userId: string }
> =
  (loaders) =>
  async ({ userId }) => {
    const { FF_ADMIN_OVERRIDE_ENABLED } = await loaders.getEnv()
    if (!FF_ADMIN_OVERRIDE_ENABLED) return false
    return await hasMinimumServerRole(loaders)({
      userId,
      role: Roles.Server.Admin
    })
  }
