import { GetServerRole } from './domain/core/operations.js'
import { GetProject, GetProjectRole } from './domain/projects/operations.js'
import { AuthPolicies } from './domain/types.js'
import { GetWorkspaceRole } from './domain/workspaces/operations.js'
import { pipelineBuilder } from './pipeline/builder.js'
import { continueIfFalse, continueIfTrue } from './pipeline/helpers.js'
import { requireExactServerRole } from './pipeline/steps/core.js'
import {
  requireExactProjectVisibility,
  requireMinimumProjectRole
} from './pipeline/steps/projects.js'
import {
  requireAnyWorkspaceRole,
  requireMinimumWorkspaceRole
} from './pipeline/steps/workspaces.js'

type AuthPoliciesContext = {
  adminOverrideEnabled: boolean
  workspacesEnabled: boolean
}

type AuthPoliciesDependencies = {
  getProject: GetProject
  getProjectRole: GetProjectRole
  getServerRole: GetServerRole
  getWorkspaceRole: GetWorkspaceRole
}

export const authPoliciesFactory = ({
  globalContext: context,
  globalDependencies: deps
}: {
  globalContext: AuthPoliciesContext
  globalDependencies: AuthPoliciesDependencies
}): AuthPolicies => {
  const { adminOverrideEnabled, workspacesEnabled } = context

  return {
    canReadProject: async ({ userId, projectId }) => {
      const project = await deps.getProject({ projectId })

      if (!project) {
        return {
          authorized: false,
          reason: 'Project not found.'
        }
      }

      const { workspaceId } = project

      const adminOverrideChecks = adminOverrideEnabled
        ? [continueIfFalse(requireExactServerRole({ role: 'server:admin' }, deps))]
        : []
      const workspaceProjectChecks =
        workspacesEnabled && workspaceId !== null
          ? [
              continueIfTrue(requireAnyWorkspaceRole({ workspaceId }, deps)),
              continueIfFalse(
                requireMinimumWorkspaceRole(
                  { workspaceId, role: 'workspace:member' },
                  deps
                )
              )
            ]
          : []

      const authPipeline = pipelineBuilder([
        continueIfFalse(
          requireExactProjectVisibility(
            { projectId, projectVisibility: 'public' },
            deps
          )
        ),
        continueIfFalse(
          requireExactProjectVisibility(
            { projectId, projectVisibility: 'linkShareable' },
            deps
          )
        ),
        ...adminOverrideChecks,
        ...workspaceProjectChecks,
        requireMinimumProjectRole({ projectId, role: 'stream:reviewer' }, deps)
      ])

      return await authPipeline({ userId })
    }
  }
}
