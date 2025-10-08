import { err, ok } from 'true-myth/result'
import {
  ProjectNoAccessError,
  ProjectNotEnoughPermissionsError,
  ProjectNotFoundError,
  ServerNoAccessError,
  ServerNoSessionError,
  ServerNotEnoughPermissionsError,
  WorkspaceNoAccessError,
  WorkspacePlanNoFeatureAccessError,
  WorkspaceNotEnoughPermissionsError,
  WorkspaceSsoSessionNoAccessError
} from '../../domain/authErrors.js'
import { MaybeUserContext, ProjectContext } from '../../domain/context.js'
import { Loaders } from '../../domain/loaders.js'
import { AuthPolicy } from '../../domain/policies.js'
import {
  ensureImplicitProjectMemberWithWriteAccessFragment,
  ensureMinimumProjectRoleFragment
} from '../../fragments/projects.js'
import { Roles } from '../../../core/constants.js'

type PolicyLoaderKeys =
  | typeof Loaders.getEnv
  | typeof Loaders.getServerRole
  | typeof Loaders.getProject
  | typeof Loaders.getWorkspaceRole
  | typeof Loaders.getWorkspace
  | typeof Loaders.getWorkspaceSsoProvider
  | typeof Loaders.getWorkspaceSsoSession
  | typeof Loaders.getProjectRole
  | typeof Loaders.getWorkspacePlan

type PolicyArgs = MaybeUserContext & ProjectContext

type PolicyErrors = InstanceType<
  | typeof ServerNoAccessError
  | typeof ServerNoSessionError
  | typeof ServerNotEnoughPermissionsError
  | typeof ProjectNotFoundError
  | typeof ProjectNoAccessError
  | typeof WorkspaceNoAccessError
  | typeof WorkspaceSsoSessionNoAccessError
  | typeof ProjectNotEnoughPermissionsError
  | typeof WorkspaceNotEnoughPermissionsError
  | typeof WorkspacePlanNoFeatureAccessError
>

export const canUpdateEmbedTokensPolicy: AuthPolicy<
  PolicyLoaderKeys,
  PolicyArgs,
  PolicyErrors
> =
  (loaders) =>
  async ({ userId, projectId }) => {
    const env = await loaders.getEnv()
    const project = await loaders.getProject({ projectId })

    if (!!project?.workspaceId && env.FF_WORKSPACES_MODULE_ENABLED) {
      // Ensure owner-level access and valid plan
      const ensuredProjectRole =
        await ensureImplicitProjectMemberWithWriteAccessFragment(loaders)({
          userId,
          projectId,
          role: Roles.Stream.Owner
        })
      if (ensuredProjectRole.isErr) {
        return err(ensuredProjectRole.error)
      }

      const plan = await loaders.getWorkspacePlan({ workspaceId: project.workspaceId })

      switch (plan?.name) {
        case 'academia':
        case 'enterprise':
        case 'pro':
        case 'proUnlimited':
        case 'proUnlimitedInvoiced':
        case 'team':
        case 'teamUnlimited':
        case 'teamUnlimitedInvoiced':
        case 'unlimited':
          return ok()
        case 'free':
        default:
          return err(new WorkspacePlanNoFeatureAccessError())
      }
    } else {
      // Ensure project owner
      const isProjectOwner = await ensureMinimumProjectRoleFragment(loaders)({
        userId: userId!,
        projectId,
        role: Roles.Stream.Owner
      })
      if (isProjectOwner.isErr) {
        return err(isProjectOwner.error)
      }

      return ok()
    }
  }
