import { MaybeUserContext, WorkspaceContext } from '../../domain/context.js'
import { AuthCheckContextLoaderKeys } from '../../domain/loaders.js'
import { AuthPolicy } from '../../domain/policies.js'
import { ensureUserIsWorkspaceAdminFragment } from '../../fragments/workspaces.js'
import {
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  WorkspaceNoAccessError,
  WorkspaceNotEnoughPermissionsError,
  WorkspacesNotEnabledError,
  WorkspaceSsoSessionNoAccessError
} from '../../domain/authErrors.js'

type PolicyArgs = MaybeUserContext & WorkspaceContext

type PolicyLoaderKeys =
  | typeof AuthCheckContextLoaderKeys.getEnv
  | typeof AuthCheckContextLoaderKeys.getServerRole
  | typeof AuthCheckContextLoaderKeys.getWorkspace
  | typeof AuthCheckContextLoaderKeys.getWorkspaceRole
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSsoProvider
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSsoSession
  | typeof AuthCheckContextLoaderKeys.getWorkspacePlan

type PolicyErrors = InstanceType<
  | typeof WorkspaceNoAccessError
  | typeof WorkspaceSsoSessionNoAccessError
  | typeof WorkspacesNotEnabledError
  | typeof ServerNoSessionError
  | typeof ServerNoAccessError
  | typeof ServerNotEnoughPermissionsError
  | typeof WorkspaceNotEnoughPermissionsError
>

export const canReadMemberEmailPolicy: AuthPolicy<
  PolicyLoaderKeys,
  PolicyArgs,
  PolicyErrors
> =
  (loaders) =>
  async ({ userId, workspaceId }) => {
    return ensureUserIsWorkspaceAdminFragment(loaders)({ userId, workspaceId })
  }
