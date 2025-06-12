import { err, ok } from 'true-myth/result'
import {
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  WorkspaceNoAccessError,
  WorkspaceNoFeatureAccessError,
  WorkspaceNotEnoughPermissionsError,
  WorkspaceReadOnlyError,
  WorkspacesNotEnabledError,
  WorkspaceSsoSessionNoAccessError
} from '../../domain/authErrors.js'
import { MaybeUserContext, WorkspaceContext } from '../../domain/context.js'
import { AuthCheckContextLoaderKeys } from '../../domain/loaders.js'
import { AuthPolicy } from '../../domain/policies.js'
import {
  ensureWorkspaceNotReadOnlyFragment,
  ensureWorkspaceRoleAndSessionFragment,
  ensureWorkspacesEnabledFragment
} from '../../fragments/workspaces.js'
import { ensureMinimumServerRoleFragment } from '../../fragments/server.js'
import { Roles } from '../../../core/constants.js'
import { WorkspacePlans } from '../../../workspaces/index.js'

type PolicyLoaderKeys =
  | typeof AuthCheckContextLoaderKeys.getEnv
  | typeof AuthCheckContextLoaderKeys.getServerRole
  | typeof AuthCheckContextLoaderKeys.getWorkspace
  | typeof AuthCheckContextLoaderKeys.getWorkspaceRole
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSsoProvider
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSsoSession
  | typeof AuthCheckContextLoaderKeys.getWorkspacePlan

type PolicyArgs = MaybeUserContext & WorkspaceContext

type PolicyErrors =
  | InstanceType<typeof WorkspaceNoAccessError>
  | InstanceType<typeof WorkspaceSsoSessionNoAccessError>
  | InstanceType<typeof WorkspaceReadOnlyError>
  | InstanceType<typeof WorkspacesNotEnabledError>
  | InstanceType<typeof ServerNoSessionError>
  | InstanceType<typeof ServerNoAccessError>
  | InstanceType<typeof ServerNotEnoughPermissionsError>
  | InstanceType<typeof WorkspaceNotEnoughPermissionsError>
  | InstanceType<typeof WorkspaceNoFeatureAccessError>

export const canUpdateEmbedOptionsPolicy: AuthPolicy<
  PolicyLoaderKeys,
  PolicyArgs,
  PolicyErrors
> =
  (loaders) =>
  async ({ userId, workspaceId }) => {
    const ensuredWorkspacesEnabled = await ensureWorkspacesEnabledFragment(loaders)({})
    if (ensuredWorkspacesEnabled.isErr) return err(ensuredWorkspacesEnabled.error)

    const ensuredServerRole = await ensureMinimumServerRoleFragment(loaders)({
      userId,
      role: Roles.Server.User
    })
    if (ensuredServerRole.isErr) return err(ensuredServerRole.error)

    const ensuredWorkspaceAccess = await ensureWorkspaceRoleAndSessionFragment(loaders)(
      {
        userId: userId!,
        workspaceId,
        role: Roles.Workspace.Admin
      }
    )
    if (ensuredWorkspaceAccess.isErr) return err(ensuredWorkspaceAccess.error)

    const ensuredNotReadOnly = await ensureWorkspaceNotReadOnlyFragment(loaders)({
      workspaceId
    })
    if (ensuredNotReadOnly.isErr) return err(ensuredNotReadOnly.error)

    const validPlans: WorkspacePlans[] = [
      'academia',
      'unlimited',
      'pro',
      'proUnlimited',
      'proUnlimitedInvoiced'
    ]
    const workspacePlan = await loaders.getWorkspacePlan({ workspaceId })
    if (!workspacePlan || !validPlans.includes(workspacePlan.name))
      return err(new WorkspaceNoFeatureAccessError())

    return ok()
  }
