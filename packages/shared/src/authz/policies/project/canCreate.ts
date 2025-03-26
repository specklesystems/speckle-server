import {
  ProjectWorkspaceRequiredError,
  ServerNoAccessError,
  UnauthenticatedError
} from '../../domain/authErrors.js'
import { AuthPolicyFactory, UserContext } from '../../domain/policies.js'
import { requireMinimumServerRoleFactory } from '../../checks/serverRole.js'
import { AuthCheckContextLoaderKeys } from '../../domain/loaders.js'
import { err, isOk, ok } from 'true-myth/result'
import { LogicError } from '../../domain/errors.js'

type PolicyLoaders =
  | typeof AuthCheckContextLoaderKeys.getEnv
  | typeof AuthCheckContextLoaderKeys.getServerRole

type PolicyArgs = UserContext

type PolicyErrors =
  | typeof ProjectWorkspaceRequiredError
  | typeof ServerNoAccessError
  | typeof UnauthenticatedError

export const canCreateProjectPolicyFactory: AuthPolicyFactory<
  PolicyLoaders,
  PolicyArgs,
  PolicyErrors
> =
  (loaders) =>
  async ({ userId }) => {
    const env = await loaders.getEnv()
    if (!isOk(env)) {
      throw new LogicError('Failed to load environment variables')
    }

    const { FF_WORKSPACES_MODULE_ENABLED, FF_WORKSPACES_NEW_PLANS_ENABLED } = env.value

    if (FF_WORKSPACES_MODULE_ENABLED) {
      if (FF_WORKSPACES_NEW_PLANS_ENABLED) {
        // Projects cannot be created outside of a workspace when new plans are enabled
        return err(ProjectWorkspaceRequiredError)
      }
    }

    if (!userId) {
      return err(UnauthenticatedError)
    }

    // Server users may create personal projects
    const hasMinimumServerRoleResult = await requireMinimumServerRoleFactory({
      loaders
    })({ userId, role: 'server:user' })

    return hasMinimumServerRoleResult ? ok(true) : err(ServerNoAccessError)
  }
