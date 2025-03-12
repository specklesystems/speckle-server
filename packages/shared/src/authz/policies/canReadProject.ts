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

export const canQueryProjectPolicyFactory =
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


        const hasMinimumMemberRole = await requireMinimumWorkspaceRole({
          loaders
        })({
          userId,
          workspaceId,
          role: 'workspace:member'
        })


        if (hasMinimumMemberRole.ok) {
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
            if (!hasValidSsoSessionResult.ok) {
              return authResult.unauthorized(hasValidSsoSessionResult.reason)
            }
          }

          // Workspace members get to go through without an explicit project role
          return authResult.authorized()
        } else {
          // just fall through to the generic project role check for workspace:guest-s
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
  project: {
    query: canQueryProjectPolicyFactory(loaders),
    createComment: canQueryProjectPolicyFactory(loaders),
  }
})

const policies = {} as AuthPolices

const readProject = await policies.project.query({ userId: '', projectId: '' })
if (!readProject.authorized) {
  console.log(readProject.statusMessage)
}

const canComment = await policies.project.createComment({ userId: '', projectId: "" })
if (!canComment.authorized) {
  console.log(canComment.statusMessage)
}

export type AuthPolices = ReturnType<typeof authPolicyFactory>
