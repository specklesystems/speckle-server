import {
  ProjectWorkspaceRequiredError,
  ServerNoAccessError,
  UnauthenticatedError
} from '../../domain/authErrors.js'
import { authorized, AuthResult, unauthorized } from '../../domain/authResult.js'
import { AuthCheckContextLoaders } from '../../domain/loaders.js'
import { UserContext } from '../../domain/policies.js'
import { requireMinimumServerRoleFactory } from '../../checks/serverRole.js'

export const createProjectPolicyFactory =
  (loaders: Pick<AuthCheckContextLoaders, 'getEnv' | 'getServerRole'>) =>
  async ({
    userId
  }: UserContext): Promise<
    AuthResult<
      | typeof ProjectWorkspaceRequiredError
      | typeof ServerNoAccessError
      | typeof UnauthenticatedError
    >
  > => {
    const { FF_WORKSPACES_MODULE_ENABLED, FF_WORKSPACES_NEW_PLANS_ENABLED } =
      loaders.getEnv()

    if (FF_WORKSPACES_MODULE_ENABLED) {
      if (FF_WORKSPACES_NEW_PLANS_ENABLED) {
        // Projects cannot be created outside of a workspace when new plans are enabled
        return unauthorized(ProjectWorkspaceRequiredError)
      }
    }

    if (!userId) {
      return unauthorized(UnauthenticatedError)
    }

    const hasMinimumServerRoleResult = await requireMinimumServerRoleFactory({
      loaders
    })({ userId, role: 'server:user' })

    return hasMinimumServerRoleResult ? authorized() : unauthorized(ServerNoAccessError)
  }
