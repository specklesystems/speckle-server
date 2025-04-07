import { MaybeUserContext } from '../domain/context.js'
import { Loaders } from '../domain/loaders.js'
import {
  AuthPolicyCheckFragment,
  AuthPolicyEnsureFragment,
  ErrorsOf,
  LoadersOf
} from '../domain/policies.js'
import { ServerNoAccessError, ServerNoSessionError } from '../domain/authErrors.js'
import { hasMinimumServerRole } from '../checks/serverRole.js'
import { Roles, ServerRoles } from '../../core/constants.js'
import { err, ok } from 'true-myth/result'

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
  | typeof Loaders.getAdminOverrideEnabled
  | LoadersOf<typeof ensureMinimumServerRoleFragment>,
  MaybeUserContext,
  ErrorsOf<typeof ensureMinimumServerRoleFragment>
> =
  (loaders) =>
  async ({ userId }) => {
    const adminOverrideAvailable = await loaders.getAdminOverrideEnabled()
    if (!adminOverrideAvailable) return ok(false)

    const hasAdminRole = await ensureMinimumServerRoleFragment(loaders)({
      userId,
      role: Roles.Server.Admin
    })
    if (hasAdminRole.isErr) return err(hasAdminRole.error)

    return ok(true)
  }
