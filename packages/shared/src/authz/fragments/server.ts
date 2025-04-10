import { MaybeUserContext } from '../domain/context.js'
import { Loaders } from '../domain/loaders.js'
import {
  AuthPolicyCheckFragment,
  AuthPolicyEnsureFragment
} from '../domain/policies.js'
import { ServerNoAccessError, ServerNoSessionError } from '../domain/authErrors.js'
import { hasMinimumServerRole } from '../checks/serverRole.js'
import { Roles, ServerRoles } from '../../core/constants.js'
import { err, ok } from 'true-myth/result'
import { throwUncoveredError } from '../../core/index.js'

/**
 * Ensure user has a minimum server role
 */
export const ensureMinimumServerRoleFragment: AuthPolicyEnsureFragment<
  typeof Loaders.getServerRole,
  MaybeUserContext & {
    /**
     * Defaults to lowest role - server Guest
     */
    role?: ServerRoles
  },
  InstanceType<typeof ServerNoAccessError | typeof ServerNoSessionError>
> =
  (loaders) =>
  async ({ userId, role: requiredServerRole }) => {
    if (!userId?.length) return err(new ServerNoSessionError())
    const isActiveServerUser = await hasMinimumServerRole(loaders)({
      userId,
      role: requiredServerRole || Roles.Server.Guest
    })

    return isActiveServerUser ? ok() : err(new ServerNoAccessError())
  }

/**
 * Check if user has admin override enabled
 */
export const checkIfAdminOverrideEnabledFragment: AuthPolicyCheckFragment<
  typeof Loaders.getAdminOverrideEnabled | typeof Loaders.getServerRole,
  MaybeUserContext,
  never
> =
  (loaders) =>
  async ({ userId }) => {
    const adminOverrideAvailable = await loaders.getAdminOverrideEnabled()
    if (!adminOverrideAvailable) return ok(false)

    const hasAdminRole = await ensureMinimumServerRoleFragment(loaders)({
      userId,
      role: Roles.Server.Admin
    })
    if (hasAdminRole.isErr) {
      switch (hasAdminRole.error.code) {
        case ServerNoAccessError.code:
        case ServerNoSessionError.code:
          return ok(false)
        default:
          throwUncoveredError(hasAdminRole.error)
      }
    }

    return ok(true)
  }
