import { MaybeUserContext } from '../domain/context.js'
import { Loaders } from '../domain/loaders.js'
import {
  AuthPolicyCheckFragment,
  AuthPolicyEnsureFragment
} from '../domain/policies.js'
import {
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError
} from '../domain/authErrors.js'
import { Roles, ServerRoles } from '../../core/constants.js'
import { err, ok } from 'true-myth/result'
import { throwUncoveredError } from '../../core/index.js'
import { isMinimumServerRole } from '../domain/logic/roles.js'

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
  InstanceType<
    | typeof ServerNoAccessError
    | typeof ServerNoSessionError
    | typeof ServerNotEnoughPermissionsError
  >
> =
  (loaders) =>
  async ({ userId, role }) => {
    if (!userId?.length) return err(new ServerNoSessionError())
    const requiredServerRole = role || Roles.Server.Guest
    const isLowestRequestedRole = (
      [Roles.Server.Guest, Roles.Server.ArchivedUser] as string[]
    ).includes(requiredServerRole)

    const userServerRole = await loaders.getServerRole({ userId })
    if (!userServerRole) return err(new ServerNoAccessError())

    const hasRequiredRole = isMinimumServerRole(userServerRole, requiredServerRole)

    return hasRequiredRole
      ? ok()
      : err(
          isLowestRequestedRole
            ? new ServerNoAccessError()
            : new ServerNotEnoughPermissionsError()
        )
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
        case ServerNotEnoughPermissionsError.code:
          return ok(false)
        default:
          throwUncoveredError(hasAdminRole.error)
      }
    }

    return ok(true)
  }
