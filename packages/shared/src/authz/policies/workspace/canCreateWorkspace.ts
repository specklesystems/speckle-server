import { err, ok } from 'true-myth/result'
import {
  EligibleForExclusiveWorkspaceError,
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  WorkspacesNotEnabledError
} from '../../domain/authErrors.js'
import { MaybeUserContext } from '../../domain/context.js'
import { AuthCheckContextLoaderKeys } from '../../domain/loaders.js'
import { AuthPolicy } from '../../domain/policies.js'
import { ensureWorkspacesEnabledFragment } from '../../fragments/workspaces.js'
import { ensureMinimumServerRoleFragment } from '../../fragments/server.js'
import { Roles } from '../../../core/constants.js'

type PolicyArgs = MaybeUserContext
type PolicyLoaderKeys =
  | typeof AuthCheckContextLoaderKeys.getEnv
  | typeof AuthCheckContextLoaderKeys.getUserEligibleWorkspaces
  | typeof AuthCheckContextLoaderKeys.getServerRole

type PolicyErrors = InstanceType<
  | typeof WorkspacesNotEnabledError
  | typeof ServerNoSessionError
  | typeof ServerNoAccessError
  | typeof ServerNotEnoughPermissionsError
  | typeof EligibleForExclusiveWorkspaceError
>

export const canCreateWorkspacePolicy: AuthPolicy<
  PolicyLoaderKeys,
  PolicyArgs,
  PolicyErrors
> =
  (loaders) =>
  async ({ userId }) => {
    const ensuredWorkspacesEnabled = await ensureWorkspacesEnabledFragment(loaders)({})
    if (ensuredWorkspacesEnabled.isErr) return err(ensuredWorkspacesEnabled.error)

    const ensuredServerRole = await ensureMinimumServerRoleFragment(loaders)({
      userId,
      role: Roles.Server.User
    })
    if (ensuredServerRole.isErr) return err(ensuredServerRole.error)

    // userId is not null here, ensured by the serverRoleFragment
    const workspaces = await loaders.getUserEligibleWorkspaces({ userId: userId! })
    const isUserEligibleForExclusiveWorkspaces = workspaces.some((w) => w.isExclusive)

    if (isUserEligibleForExclusiveWorkspaces) {
      return err(new EligibleForExclusiveWorkspaceError())
    }
    return ok()
  }
