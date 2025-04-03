import { Roles, ServerRoles } from '../../core/constants.js'
import { UserContext } from '../domain/context.js'
import { isMinimumServerRole } from '../domain/logic/roles.js'
import { AuthPolicyCheck } from '../domain/policies.js'

export const hasMinimumServerRole: AuthPolicyCheck<
  'getServerRole',
  UserContext & { role: ServerRoles }
> =
  (loaders) =>
  async ({ userId, role: requiredServerRole }) => {
    const userServerRole = await loaders.getServerRole({ userId })
    if (!userServerRole) return false
    return isMinimumServerRole(userServerRole, requiredServerRole)
  }

export const canUseAdminOverride: AuthPolicyCheck<
  'getEnv' | 'getServerRole',
  UserContext
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
