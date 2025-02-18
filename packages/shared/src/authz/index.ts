import { type WorkspaceRoles, Roles } from '../core/constants.js'

type AuthResult = {
  authorized: boolean
}

type AuthFailedResult = AuthResult & {
  authorized: false
  errorMessage: string
  errorStatusCode: number
  // error: BaseError | null
  fatal?: boolean
}

// type AuthSuccessResult = AuthResult & {
//   authorized: true
// }

type WorkspacePlans = 'free' | 'starter' | 'business' | 'unlimited'

type AuthContext = {
  authResult: AuthResult
  context: {
    userWorkspaceRole?: WorkspaceRoles
    workspace?: {
      plan?: WorkspacePlans
    }
  }
}

type AuthFunction = (context: AuthContext) => AuthResult
type AuthPipeline = (ctx: Omit<AuthContext, 'authResult'>) => AuthResult

// type Role = {
//   weight: number
// }

// type WorkspaceRole = Role & {
//   name: WorkspaceRoles
// }

export const authHasFailed = (authResult: AuthResult): authResult is AuthFailedResult =>
  'error' in authResult

const authPipelineCreator = (steps: AuthFunction[]): AuthPipeline => {
  const pipeline: AuthPipeline = ({ context }) => {
    let authResult = { authorized: false }
    for (const step of steps) {
      authResult = step({ authResult, context })
      if (authHasFailed(authResult) && authResult?.fatal) break
    }
    if (authResult.authorized && authHasFailed(authResult))
      throw new Error('this is very wrong')
    return authResult
  }
  return pipeline
}

const checkWorkspaceRoleFactory = ({
  workspaceRole
}: {
  workspaceRole: WorkspaceRoles
}): AuthFunction => {
  const workspaceRoles = [
    {
      name: Roles.Workspace.Admin,
      weight: 1000
    },
    {
      name: Roles.Workspace.Member,
      weight: 100
    },
    {
      name: Roles.Workspace.Guest,
      weight: 50
    }
  ]
  const requiredRole = workspaceRoles.find((r) => r.name === workspaceRole)
  if (!requiredRole) throw new Error('you cannot validate against a non existing role')

  return ({ context }) => {
    const userRole = workspaceRoles.find((r) => r.name === context.userWorkspaceRole)
    if (!userRole || userRole.weight < requiredRole.weight)
      return {
        authorized: false,
        errorMessage: 'You do not have the required workspace role',
        errorStatusCode: 401
      }
    return { authorized: true }
  }
}

const workspacePlanLimits: { [P in WorkspacePlans]: { projectLimit?: number } } = {
  starter: { projectLimit: 3 },
  free: { projectLimit: 1 },
  business: { projectLimit: 100 },
  unlimited: {}
}

const checkPlanLimitFactory =
  ({ newProjectCount }: { newProjectCount: number }): AuthFunction =>
  ({ context }) => {
    if (
      !context.workspace ||
      !context.workspace.plan ||
      !(context.workspace.plan in workspacePlanLimits)
    ) {
      return {
        authorized: false,
        errorMessage: 'Invalid workspace plan',
        errorStatusCode: 401
      }
    }
    const limits = workspacePlanLimits[context.workspace.plan]
    if (!limits.projectLimit)
      return {
        authorized: true
      }
    if (newProjectCount > limits.projectLimit) {
      return {
        authorized: false,
        errorMessage: 'Too many projects, buy more',
        errorStatusCode: 403
      }
    }
    return {
      authorized: true
    }
  }

const createNewWorkspaceProjectResolver = () => {
  // count projects in DB
  const newProjectCount = 10 + 1

  const authFunction = authFunctionStore.createWorkspaceProject({
    newProjectCount
  })

  // const canCreateNewProject = authFunctionCreation.createWorkspaceProject(10)
  // based on userID
  const userWorkspaceRole = 'workspace:member'
  // based on workspaceId
  const workspace = { plan: 'starter' } as const

  authFunction({
    // authResult: { authorized: false },
    context: { userWorkspaceRole, workspace }
  })
  //... continue creating a new project
}

createNewWorkspaceProjectResolver()

type AuthFunctionStore = {
  createWorkspaceProject: (args: { newProjectCount: number }) => AuthPipeline
  foobar: () => AuthPipeline
}

// type AuthActions = keyof AuthFunctionStore

const authFunctionStore: AuthFunctionStore = {
  createWorkspaceProject: ({ newProjectCount }: { newProjectCount: number }) =>
    authPipelineCreator([
      checkWorkspaceRoleFactory({ workspaceRole: 'workspace:member' }),
      checkPlanLimitFactory({ newProjectCount })
    ]),
  foobar: () => {
    throw 'foobar'
  }
}
