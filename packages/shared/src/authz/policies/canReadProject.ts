import {
  requireAnyWorkspaceRole,
  requireMinimumWorkspaceRole
} from '../checks/workspaceRole.js'
import { AuthResult } from '../domain/types.js'
import {
  requireExactProjectVisibility,
  requireMinimumProjectRole
} from '../checks/projects.js'
import { ChuckContextLoaders } from '../domain/loaders.js'
import { ProjectContext, UserContext } from '../domain/policies.js'
import { authResult } from '../helpers/result.js'
import { requireExactServerRole } from '../checks/serverRole.js'
import { requireValidWorkspaceSsoSession } from '../checks/workspaceSso.js'

export const canReadProjectPolicyFactory =
  (
    loaders: Pick<
      ChuckContextLoaders,
      | 'getEnv'
      | 'getProject'
      | 'getProjectRole'
      | 'getServerRole'
      | 'getWorkspaceRole'
      | 'getWorkspaceSsoProvider'
      | 'getWorkspaceSsoSession'
    >
  ) =>
  async ({ userId, projectId }: UserContext & ProjectContext): Promise<AuthResult> => {
    const { FF_ADMIN_OVERRIDE_ENABLED, FF_WORKSPACES_MODULE_ENABLED } = loaders.getEnv()

    const project = await loaders.getProject({ projectId })
    if (!project) return authResult.unauthorized('Project not found.')

    // All users may read public projects
    const isPublicResult = await requireExactProjectVisibility({ loaders })({
      projectId,
      projectVisibility: 'public'
    })
    if (isPublicResult.ok) {
      return authResult.authorized()
    }

    // All users may read link-shareable projects
    const isLinkShareableResult = await requireExactProjectVisibility({ loaders })({
      projectId,
      projectVisibility: 'linkShareable'
    })
    if (isLinkShareableResult.ok) {
      return authResult.authorized()
    }

    // When G O D M O D E is enabled
    if (FF_ADMIN_OVERRIDE_ENABLED) {
      // Server admins may read all project data
      const isServerAdminResult = await requireExactServerRole({ loaders })({
        userId,
        role: 'server:admin'
      })
      if (isServerAdminResult.ok) {
        return authResult.authorized()
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
      if (!hasWorkspaceRoleResult.ok) {
        return authResult.unauthorized(hasWorkspaceRoleResult.reason)
      }

      // When a workspace has SSO configured
      const workspaceSsoProvider = await loaders.getWorkspaceSsoProvider({
        workspaceId
      })
      if (!!workspaceSsoProvider) {
        // When the user is not a workspace guest
        const userWorkspaceRole = await loaders.getWorkspaceRole({
          userId,
          workspaceId
        })
        if (userWorkspaceRole !== 'workspace:guest') {
          // User must be a workspace member or admin to read project data
          // TODO: This check is strictly redundant but is useful for policy legibility. Remove?
          const hasMinimumWorkspaceRoleResult = await requireMinimumWorkspaceRole({
            loaders
          })({
            userId,
            workspaceId,
            role: 'workspace:member'
          })
          if (!hasMinimumWorkspaceRoleResult.ok) {
            return authResult.unauthorized(hasMinimumWorkspaceRoleResult.reason)
          }

          // User must have a valid SSO session to read project data
          const hasValidSsoSessionResult = await requireValidWorkspaceSsoSession({
            loaders
          })({
            userId,
            workspaceId
          })
          if (!hasValidSsoSessionResult.ok) {
            return authResult.unauthorized(hasValidSsoSessionResult.reason)
          }
        }
      }

      // When a workspace does not have SSO configured
      if (!workspaceSsoProvider) {
        // Workspace members and admins may read project data
        const hasMinimumWorkspaceRoleResult = await requireMinimumWorkspaceRole({
          loaders
        })({
          userId,
          workspaceId,
          role: 'workspace:member'
        })
        if (hasMinimumWorkspaceRoleResult.ok) {
          return authResult.authorized()
        }
      }
    }

    // User must have at least stream reviewer role to read project data
    const hasMinimumProjectRoleResult = await requireMinimumProjectRole({ loaders })({
      userId,
      projectId,
      role: 'stream:reviewer'
    })
    if (!hasMinimumProjectRoleResult.ok) {
      return authResult.unauthorized(hasMinimumProjectRoleResult.reason)
    }

    return authResult.authorized()
  }

export const authPolicyFactory = (loaders: ChuckContextLoaders) => ({
  canReadProject: canReadProjectPolicyFactory(loaders)
})

export type AuthPolices = ReturnType<typeof authPolicyFactory>
