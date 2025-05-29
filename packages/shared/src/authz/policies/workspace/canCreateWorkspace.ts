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
import { throwUncoveredError } from '../../../core/index.js'

type PolicyArgs = MaybeUserContext
type PolicyLoaderKeys =
  | typeof AuthCheckContextLoaderKeys.getEnv
  | typeof AuthCheckContextLoaderKeys.getUsersCurrentAndEligibleToBecomeAMemberWorkspaces
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
    const workspaces =
      await loaders.getUsersCurrentAndEligibleToBecomeAMemberWorkspaces({
        userId: userId!
      })
    const isUserEligibleForExclusiveWorkspaces = workspaces.some((w) => {
      if (w.isExclusive) {
        // if the user has no role in the workspace, means they are eligible
        // to join it via an invite or discovery
        if (!w.role) return true
        // for exclusive workspaces, if the user has a role, some of them are not affected by this policy
        // ie.: Workspace admins of exclusive workspaces should be able to create new ones
        //      also guests should not be bound by this rule
        switch (w.role) {
          case Roles.Workspace.Admin:
          case Roles.Workspace.Guest:
            return false
          case Roles.Workspace.Member:
            return true
          default:
            throwUncoveredError(w.role)
        }
      }
      return false
    })

    if (isUserEligibleForExclusiveWorkspaces) {
      return err(new EligibleForExclusiveWorkspaceError())
    }
    return ok()
  }
