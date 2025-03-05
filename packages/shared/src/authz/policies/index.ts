import { requireMinimumProjectRoleFactory, requireMinimumServerRoleFactory } from "./clauses.js"
import { continueIfFalse } from "./helpers.js"
import { GetProject, GetProjectRole, GetServerRole } from "./loaders.js"
import { AuthResult } from "./types.js"

type AuthPolicies = {
  // Args are request-time information
  canUpdateProject: (args: { userId: string, projectId: string }) => Promise<AuthResult>
}


export const authAndCanIShouldIPoliciesFactory = (
  // Static configuration, like environment variables
  configuration: {
    enableAdminOverride: boolean,
    enableWorkspaces: boolean
  },
  // Injected by client (BE, FE, DUI3)
  loaders: {
    // TODO: Cached and safe to call multiple times in a pipeline
    getProject: GetProject
    getProjectRole: GetProjectRole
    getServerRole: GetServerRole
    // Multiregion !
  }
): AuthPolicies => {
  return {
    canUpdateProject: async ({ userId, projectId }) => {
      const project = await loaders.getProject({ projectId })

      // TODO: Error vs unauthorized
      if (!project) {
        return {
          authorized: false,
          reason: 'project not found'
        }
      }

      const isWorkspaceProject = project.workspaceId !== null

      // Conditional pipeline checks
      const adminOverrideChecks = configuration.enableAdminOverride
        ? [
          continueIfFalse(requireMinimumServerRoleFactory({ minimumRole: 'server:admin' }, loaders))
        ]
        : []
      const workspaceProjectChecks = isWorkspaceProject
        ? [

        ]
        : []

      const authPipeline = authPipelineFactory([
        continueIfFalse(requireProjectVisibilityFactory({ project, projectVisibility: 'public' })),
        continueIfFalse(requireProjectVisibilityFactory({ project, projectVisibility: 'linkShareable' })),
        ...adminOverrideChecks,
        ...workspaceProjectChecks,
        requireMinimumProjectRoleFactory({ minimumRole: 'contributor', projectId }, loaders),

      ])

      const authResult = await authPipeline({ userId })
      return authResult
    }
  }
}