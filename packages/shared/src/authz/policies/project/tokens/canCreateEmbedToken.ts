import { err, ok } from "true-myth/result";
import { ProjectNoAccessError, ProjectNotEnoughPermissionsError, ProjectNotFoundError, ServerNoAccessError, ServerNoSessionError, ServerNotEnoughPermissionsError, WorkspaceNoAccessError, WorkspacePlanNoFeatureAccessError, WorkspaceNotEnoughPermissionsError, WorkspaceSsoSessionNoAccessError } from "../../../domain/authErrors.js";
import { MaybeUserContext, ProjectContext } from "../../../domain/context.js";
import { Loaders } from "../../../domain/loaders.js";
import { AuthPolicy } from "../../../domain/policies.js";
import { ensureMinimumServerRoleFragment } from "../../../fragments/server.js";
import { ensureImplicitProjectMemberWithWriteAccessFragment } from "../../../fragments/projects.js";
import { Roles } from "../../../../core/constants.js";

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

export const canCreateEmbedToken: AuthPolicy<PolicyLoaderKeys, PolicyArgs, PolicyErrors>
  = (loaders) =>
    async ({ userId, projectId }) => {
      // Ensure logged in
      const ensuredServerRole = await ensureMinimumServerRoleFragment(loaders)({
        userId
      })
      if (ensuredServerRole.isErr) {
        return err(ensuredServerRole.error)
      }

      // Ensure project owner
      const isProjectOwner = await ensureImplicitProjectMemberWithWriteAccessFragment(loaders)({
        userId,
        projectId,
        role: Roles.Stream.Owner
      })
      if (isProjectOwner.isErr) {
        return err(isProjectOwner.error)
      }

      const env = await loaders.getEnv()
      if (!env.FF_WORKSPACES_MODULE_ENABLED) {
        // Workspace are not enabled, no further checks
        return ok()
      }

      const project = await loaders.getProject({ projectId })
      if (!project?.workspaceId) {
        // Project is not in a workspace, no plan to check
        return ok()
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
    }