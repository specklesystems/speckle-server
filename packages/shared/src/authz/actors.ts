import { type WorkspaceRoles } from '../core/constants.js'
import {
  authPipelineCreator,
  AuthResult,
  checkPlanLimitFactory,
  checkWorkspaceRoleFactory,
  workspacePlanLimits,
  WorkspacePlans
} from './index.js'

type AuthUserContext = {
  userId: string
}

type WorkspaceContext = {
  workspaceId: string
}

type AuthWorkspaceContext = AuthUserContext & WorkspaceContext

export type Authorizations = {
  createWorkspaceProject: AuthWorkspaceContext
  createWorkspaceProjectPipeline: AuthWorkspaceContext
}

// TODO Also include feature flags in the context

type Auth = {
  [A in keyof Authorizations]: (args: Authorizations[A]) => AuthResult
}

const authFactory = (deps: {
  loadWorkspaceRole: (args: AuthWorkspaceContext) => WorkspaceRoles
  countWorkspaceProjects: (args: WorkspaceContext) => number
  loadWorkspacePlan: (args: WorkspaceContext) => WorkspacePlans
}): Auth => ({
  createWorkspaceProject: ({ userId, workspaceId }) => {
    const userWorkspaceRole = deps.loadWorkspaceRole({ userId, workspaceId })

    if (userWorkspaceRole !== 'workspace:admin') {
      return { authorized: false, errorMessage: 'not an admin', status: 401 }
    }
    const workspacePlan = deps.loadWorkspacePlan({ workspaceId })

    if (!(workspacePlan in workspacePlanLimits)) {
      return {
        authorized: false,
        errorMessage: 'Invalid workspace plan',
        errorStatusCode: 401
      }
    }
    const limits = workspacePlanLimits[workspacePlan]

    const currentProjectCount = deps.countWorkspaceProjects({ workspaceId })
    if (limits.projectLimit && limits.projectLimit <= currentProjectCount + 1) {
      return { authorized: false, errorMessage: 'too many projects', status: 401 }
    }

    return {
      authorized: true
    }
  },
  createWorkspaceProjectPipeline: ({ userId, workspaceId }) => {
    // loading should be happening lazy on demand by the steps
    // loaders should also cache so that requesting the same thing twice is cheap

    const userWorkspaceRole = deps.loadWorkspaceRole({ userId, workspaceId })
    const currentProjectCount = deps.countWorkspaceProjects({ workspaceId })
    const plan = deps.loadWorkspacePlan({ workspaceId })
    const pipeline = authPipelineCreator([
      checkWorkspaceRoleFactory({ workspaceRole: 'workspace:admin' }),
      checkPlanLimitFactory({ newProjectCount: currentProjectCount + 1 })
    ])

    return pipeline({ context: { workspace: { plan, userWorkspaceRole } } })
  }
})

const auth = authFactory({
  loadWorkspaceRole: () => 'workspace:admin',
  countWorkspaceProjects: () => 10,
  loadWorkspacePlan: () => 'starter'
})

const projRes = auth.createWorkspaceProject({ userId: 'asdf', workspaceId: 'asdf' })

if (!projRes.authorized) {
  console.log(projRes.errorMessage)
} else {
  console.log(projRes.authorized)
}
