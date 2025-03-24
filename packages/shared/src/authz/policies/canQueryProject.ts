import {
  requireAnyWorkspaceRole,
  requireMinimumWorkspaceRole
} from '../checks/workspaceRole.js'
import { AuthResult, authorized, unauthorized } from '../domain/authResult.js'
import {
  requireExactProjectVisibilityFactory,
  requireMinimumProjectRoleFactory
} from '../checks/projects.js'
import { AuthCheckContextLoaders } from '../domain/loaders.js'
import { ProjectContext, UserContext } from '../domain/policies.js'
import { requireExactServerRole } from '../checks/serverRole.js'
import { requireValidWorkspaceSsoSession } from '../checks/workspaceSso.js'
import { Roles } from '../../core/constants.js'
import {
  ProjectNoAccessError,
  ProjectNotFoundError,
  WorkspaceNoAccessError,
  WorkspaceSsoSessionInvalidError
} from '../domain/authErrors.js'

export const canQueryProjectPolicyFactory =
  (
    loaders: Pick<
      AuthCheckContextLoaders,
      | 'getEnv'
      | 'getProject'
      | 'getProjectRole'
      | 'getServerRole'
      | 'getWorkspaceRole'
      | 'getWorkspaceSsoProvider'
      | 'getWorkspaceSsoSession'
    >
  ) =>
  async ({
    userId,
    projectId
  }: UserContext & ProjectContext): Promise<
    AuthResult<
      | typeof ProjectNotFoundError
      | typeof ProjectNoAccessError
      | typeof WorkspaceNoAccessError
      | typeof WorkspaceSsoSessionInvalidError
    >
  > => {
    const { FF_ADMIN_OVERRIDE_ENABLED, FF_WORKSPACES_MODULE_ENABLED } = loaders.getEnv()

    const project = await loaders.getProject({ projectId })
    // hiding the project not found, to stop id brute force lookups
    if (!project) return unauthorized(ProjectNotFoundError)

    // All users may read public projects
    const isPublicResult = await requireExactProjectVisibilityFactory({ loaders })({
      projectId,
      projectVisibility: 'public'
    })
    if (isPublicResult) {
      return authorized()
    }

    // All users may read link-shareable projects
    const isLinkShareableResult = await requireExactProjectVisibilityFactory({
      loaders
    })({
      projectId,
      projectVisibility: 'linkShareable'
    })
    if (isLinkShareableResult) {
      return authorized()
    }
    // From this point on, you cannot pass as an unknown user
    if (!userId) {
      return unauthorized(ProjectNoAccessError)
    }

    // When G O D M O D E is enabled
    if (FF_ADMIN_OVERRIDE_ENABLED) {
      // Server admins may read all project data
      const isServerAdminResult = await requireExactServerRole({ loaders })({
        userId,
        role: Roles.Server.Admin
      })
      if (isServerAdminResult) {
        return authorized()
      }
    }

    const { workspaceId } = project

    // When a project belongs to a workspace
    if (FF_WORKSPACES_MODULE_ENABLED && !!workspaceId) {
      // User must have a workspace role to read project data
      const hasWorkspaceRoleResult = await requireAnyWorkspaceRole({ loaders })({
        userId,
        workspaceId
      })
      if (!hasWorkspaceRoleResult) {
        // Should we hide the fact, the project is in a workspace?
        return unauthorized(WorkspaceNoAccessError)
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
        if (!!workspaceSsoProvider) {
          // Member and admin user must have a valid SSO session to read project data
          const hasValidSsoSessionResult = await requireValidWorkspaceSsoSession({
            loaders
          })({
            userId,
            workspaceId
          })
          if (!hasValidSsoSessionResult) {
            return unauthorized(WorkspaceSsoSessionInvalidError)
          }
        }

        // Workspace members get to go through without an explicit project role
        return authorized()
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
      return authorized()
    }
    return unauthorized(ProjectNoAccessError)
  }
