import { type WorkspaceRoles } from '../core/constants.js'

// type AuthzBase = {
//   authorized: boolean
// }

type AuthzFailed = {
  authorized: false
  status: number
  errorMessage: string
}

type AuthzSuccess = {
  authorized: true
}

type AuthzResult = AuthzSuccess | AuthzFailed

type AuthUserContext = {
  userId: string
}

type WorkspaceContext = {
  workspaceId: string
}

type AuthWorkspaceContext = AuthUserContext & WorkspaceContext

export type Authorizations = {
  // hasServerRole: AuthUserContext & { serverRole: ServerRoles }
  createWorkspaceProject: AuthWorkspaceContext
  // createNonWorkspaceProject: AuthUserContext
  // canCreateNewModel: (args: { userId: string }) => AuthzResult
}

// TODO Also include feature flags in the context

type Auth = {
  [A in keyof Authorizations]: (args: Authorizations[A]) => AuthzResult
}

// const AuthorizationActions = {
//   Workspace: {
//     Project: {
//       Create: 'workspace.project.create'
//     }
//   }
// } as const

const authFactory = (deps: {
  loadWorkspaceRole: (args: AuthWorkspaceContext) => WorkspaceRoles
  countWorkspaceProjects: (args: WorkspaceContext) => number
  loadWorkspacePlan: (args: WorkspaceContext) => {
    limit: { projectLimit: number | null }
  }
}): Auth => ({
  createWorkspaceProject: ({ userId, workspaceId }) => {
    const userWorkspaceRole = deps.loadWorkspaceRole({ userId, workspaceId })

    if (userWorkspaceRole !== 'workspace:admin') {
      return { authorized: false, errorMessage: 'not an admin', status: 401 }
    }
    const currentProjectCount = deps.countWorkspaceProjects({ workspaceId })
    const workspacePlan = deps.loadWorkspacePlan({ workspaceId })

    if (
      workspacePlan.limit.projectLimit &&
      workspacePlan.limit.projectLimit <= currentProjectCount + 1
    ) {
      return { authorized: false, errorMessage: 'too many projects', status: 401 }
    }

    return {
      authorized: true
    }
  }
})

const auth = authFactory({
  loadWorkspaceRole: () => 'workspace:admin',
  countWorkspaceProjects: () => 10,
  loadWorkspacePlan: () => ({
    limit: {
      projectLimit: 11
    }
  })
})

const projRes = auth.createWorkspaceProject({ userId: 'asdf', workspaceId: 'asdf' })

if (!projRes.authorized) {
  console.log(projRes.errorMessage)
} else {
  projRes.authorized
}

// auth.hasServerRole({ userId: 'asdf', serverRole: 'server:user' }).authorized
