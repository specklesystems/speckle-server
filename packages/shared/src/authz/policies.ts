import { GetServerRole } from './domain/core/operations.js'
import { GetProject, GetProjectRole } from './domain/projects/operations.js'
import { AuthPolicies } from './domain/types.js'
import { GetWorkspaceRole } from './domain/workspaces/operations.js'
import { pipelineBuilder } from './pipeline/builder.js'
import { continueIfFalse, continueIfTrue, skip, skipIf } from './pipeline/helpers.js'
import { requireExactServerRole } from './pipeline/steps/core.js'
import {
  requireExactProjectVisibility,
  requireMinimumProjectRole
} from './pipeline/steps/projects.js'
import {
  requireAnyWorkspaceRole,
  requireExactWorkspaceRole,
  requireMinimumWorkspaceRoleFactory
} from './pipeline/steps/workspaces.js'

// type AuthPoliciesContext = {
//   adminOverrideEnabled: boolean
//   workspacesEnabled: boolean
// }

type AuthPoliciesDependencies = {
  loadEnvOrSomething: () => {
    FF_ADMIN_OVERRIDE_ENABLED: boolean
    FF_WORKSPACES_MODULE_ENABLED: boolean
  }
  getProject: GetProject
  getProjectRole: GetProjectRole
  getServerRole: GetServerRole
  getWorkspaceRole: GetWorkspaceRole
}

export const authPoliciesFactory = ({
  // globalContext: context,
  globalDependencies: deps
}: {
  // globalContext: AuthPoliciesContext // this can be just context
  globalDependencies: AuthPoliciesDependencies // this can be just deps or loaders
}): AuthPolicies => {
  const { FF_ADMIN_OVERRIDE_ENABLED, FF_WORKSPACES_MODULE_ENABLED } = deps.loadEnvOrSomething()

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


      const isWorkspaceProject = workspaceId !== null

      const userWorkspaceRole = isWorkspaceProject ? await deps.getWorkspaceRole({ userId, workspaceId }) : null
      const isSsoEnabledWorkspace = isWorkspaceProject ? true : false

      const adminOverrideChecks = FF_ADMIN_OVERRIDE_ENABLED
        ? [continueIfFalse(requireExactServerRole({ role: 'server:admin' }, deps))]
        : []
      const workspaceProjectChecks =
        FF_WORKSPACES_MODULE_ENABLED && isWorkspaceProject
          ? [
            continueIfTrue(requireAnyWorkspaceRole({ workspaceId }, deps)),
            continueIfFalse(
              requireMinimumWorkspaceRole({ workspaceId, role: 'workspace:member' })

              requireMinimumWorkspaceRoleFactory(deps)(
                { workspaceId, role: 'workspace:member' },
                deps
              )
            )
          ]
          : []
      const workspaceSsoChecks =
        FF_WORKSPACES_MODULE_ENABLED && isSsoEnabledWorkspace
          ? [
            userWorkspaceRole === 'workspace:guest' ? skip() : requireValidSsoSession()
          ]
          : []

      requireMinimumWorkspaceRole(
        { workspaceId, role: 'workspace:member' },
        deps
      )

      const result = requireAnyWorkspaceRole()

      if (!result.authorized) {
        return result
      }

      const authPipeline = pipelineBuilder([
        continueIfFalse(
          requireExactProjectVisibility(
            { projectId, projectVisibility: 'public' },
            deps
          )
        ),
        continueIfUnauthorizedByTheCheckHere(
          requireExactProjectVisibility(
            { projectId, projectVisibility: 'linkShareable' },
            deps
          )
        ),
        onlyDoSomethingIf(allConditions, theThing)

        // skipIf({
        //   condition: true,
        //   steps: [

        //   ]
        // }),
        // ...adminOverrideChecks,
        // ...workspaceProjectChecks,
        // ...workspaceSsoChecks,
        requireMinimumProjectRole({ projectId, role: 'stream:reviewer' }, deps)
      ])

      return await authPipeline({ userId })
    }
  }
}

const canReadProject = canReadProjectPolicyFactory({
  requireMinimumWorkspaceRole: requireMinimumWorkspaceRoleFactory({
    getWorkspaceRole: () => { }
  })
}: {

})