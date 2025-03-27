import {
  requireAnyWorkspaceRole,
  requireMinimumWorkspaceRole
} from '../checks/workspaceRole.js'
import {
  requireExactProjectVisibilityFactory,
  requireMinimumProjectRoleFactory
} from '../checks/projects.js'
import { AuthPolicyFactory, ProjectContext, UserContext } from '../domain/policies.js'
import { requireExactServerRole } from '../checks/serverRole.js'
import { requireValidWorkspaceSsoSession } from '../checks/workspaceSso.js'
import { Roles } from '../../core/constants.js'
import {
  ProjectNoAccessError,
  ProjectNotFoundError,
  WorkspaceNoAccessError,
  WorkspaceSsoSessionNoAccessError
} from '../domain/authErrors.js'
import { err, ok } from 'true-myth/result'
import { AuthCheckContextLoaderKeys } from '../domain/loaders.js'
import { LogicError } from '../domain/errors.js'

export const canQueryProjectPolicyFactory: AuthPolicyFactory<
  | typeof AuthCheckContextLoaderKeys.getEnv
  | typeof AuthCheckContextLoaderKeys.getProject
  | typeof AuthCheckContextLoaderKeys.getProjectRole
  | typeof AuthCheckContextLoaderKeys.getServerRole
  | typeof AuthCheckContextLoaderKeys.getWorkspaceRole
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSsoProvider
  | typeof AuthCheckContextLoaderKeys.getWorkspaceSsoSession
  | typeof AuthCheckContextLoaderKeys.getWorkspace,
  UserContext & ProjectContext,
  | InstanceType<typeof ProjectNotFoundError>
  | InstanceType<typeof ProjectNoAccessError>
  | InstanceType<typeof WorkspaceNoAccessError>
  | InstanceType<typeof WorkspaceSsoSessionNoAccessError>
> =
  (loaders) =>
  async ({ userId, projectId }) => {
    const env = await loaders.getEnv()
    if (!env.isOk) {
      throw new LogicError('Failed to load environment variables')
    }

    const { FF_ADMIN_OVERRIDE_ENABLED, FF_WORKSPACES_MODULE_ENABLED } = env.value

    const project = await loaders.getProject({ projectId })
    if (!project.isOk) {
      return err(project.error)
    }

    // All users may read public projects
    const isPublicResult = await requireExactProjectVisibilityFactory({ loaders })({
      projectId,
      projectVisibility: 'public'
    })
    if (isPublicResult) {
      return ok(true)
    }

    // All users may read link-shareable projects
    const isLinkShareableResult = await requireExactProjectVisibilityFactory({
      loaders
    })({
      projectId,
      projectVisibility: 'linkShareable'
    })
    if (isLinkShareableResult) {
      return ok(true)
    }
    // From this point on, you cannot pass as an unknown user
    if (!userId) {
      return err(new ProjectNoAccessError())
    }

    // When G O D M O D E is enabled
    if (FF_ADMIN_OVERRIDE_ENABLED) {
      // Server admins may read all project data
      const isServerAdminResult = await requireExactServerRole({ loaders })({
        userId,
        role: Roles.Server.Admin
      })
      if (isServerAdminResult) {
        return ok(true)
      }
    }

    const { workspaceId } = project.value

    // When a project belongs to a workspace
    if (FF_WORKSPACES_MODULE_ENABLED && !!workspaceId) {
      // Get workspace, so we can resolve its slug
      const workspace = await loaders.getWorkspace({ workspaceId })
      if (!workspace.isOk) {
        return err(new WorkspaceNoAccessError())
      }

      // User must have a workspace role to read project data
      const hasWorkspaceRoleResult = await requireAnyWorkspaceRole({ loaders })({
        userId,
        workspaceId
      })
      if (!hasWorkspaceRoleResult) {
        // Should we hide the fact, the project is in a workspace?
        return err(new WorkspaceNoAccessError())
      }

      const hasMinimumMemberRole = await requireMinimumWorkspaceRole({
        loaders
      })({
        userId,
        workspaceId,
        role: 'workspace:member'
      })

      if (hasMinimumMemberRole) {
        const workspaceSsoProvider = await loaders.getWorkspaceSsoProvider({
          workspaceId
        })
        if (workspaceSsoProvider.isOk) {
          // Member and admin user must have a valid SSO session to read project data
          const hasValidSsoSessionResult = await requireValidWorkspaceSsoSession({
            loaders
          })({
            userId,
            workspaceId
          })
          if (!hasValidSsoSessionResult) {
            return err(
              new WorkspaceSsoSessionNoAccessError({
                payload: { workspaceSlug: workspace.value.slug }
              })
            )
          }
        }

        // Workspace members get to go through without an explicit project role
        return ok(true)
      } else {
        // just fall through to the generic project role check for workspace:guest-s
      }
    }

    // User must have at least stream reviewer role to read project data
    const hasMinimumProjectRoleResult = await requireMinimumProjectRoleFactory({
      loaders
    })({
      userId,
      projectId,
      role: 'stream:reviewer'
    })
    if (hasMinimumProjectRoleResult) {
      return ok(true)
    }
    return err(new ProjectNoAccessError())
  }
