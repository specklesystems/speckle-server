type AuthResult = boolean | null


type AuthPolicies = {
  // Always request-bound?
  // forReqContext: (ctx: { userId: string }) => AuthPolicies

  canReadProject: (args: { userId: string; projectId: string }) => Promise<AuthResult>
}

// type AuthDependencies = {
//   getProject: GetProject
// }

type Project = {
  isPublic: boolean; isDiscoverable: boolean; workspaceId: string | null
}

type GetProject = (args: {
  projectId: string
}) => Promise<Project | null>

type ProjectRoles = 'reviewer' | 'contributor' | 'owner'
type ServerRoles = 'guest' | 'user' | 'admin'
type WorkspaceRoles = 'guest' | 'member' | 'ws_admin'

type UserProjectRole = {
  role: ProjectRoles
}

type UserServerRole = {
  role: ServerRoles
}

type UserWorkspaceRole = {
  role: ServerRoles
}

type GetProjectRole = (args:
  {
    userId: string
    projectId: string
  }
) => Promise<UserProjectRole | null>

type GetServerRole = (args:
  {
    userId: string
  }
) => Promise<UserServerRole | null>

type GetWorkspaceRole = (args:
  {
    userId: string
    workspaceId: string
  }
) => Promise<UserWorkspaceRole | null>

export const authPoliciesFactory =
  // (requestTimeAuthInfo: { userId: string; projectId?: string }) =>
  (
    configuration: {
      FF_ADMIN_OVERRIDE_ENABLED: boolean,
      FF_WORKSPACES_ENABLED: boolean
    },
    loaders: {
      // Implied cache, loading is "cheap"
      getProject: GetProject
      getProjectRole: GetProjectRole
      getServerRole: GetServerRole
      // getProjectRole
    }
  ): AuthPolicies => {
    const { } = configuration

    return {
      canReadProject: async ({ userId, projectId }) => {
        const project = await loaders.getProject({ projectId })

        if (!project) return false

        const isWorkspaceProject = project?.workspaceId !== null

        const adminOverrideChecks =
          configuration.FF_ADMIN_OVERRIDE_ENABLED ? [imOkToContinueIfFalse(hasMinimumServerRoleFactory({ minimumRole: 'admin' }, loaders))] : []

        const workspaceProjectChecks = isWorkspaceProject ? [

        ] : []


        const authPipeline = authPipelineFactory([
          imOkToContinueIfFalse(requireProjectVisibilityFactory({ project, projectVisibility: 'public' })),
          // there is not weighted ordering of project visibility
          imOkToContinueIfFalse(requireProjectVisibilityFactory({ project, projectVisibility: 'linkShareable' })),
          hasMinimumProjectRoleFactory({ minimumRole: 'contributor', projectId }, loaders),
          ...adminOverrideChecks,
          ...workspaceProjectChecks,
          hasMinimumProjectRoleFactory({ minimumRole: 'reviewer', projectId }, loaders),
        ])


        // Feature flags
        // Branching

        const authResult = await authPipeline({ userId })
        return authResult

      }
    }
  }

// ifTrue(FF_ADMIN_OVERRIDE_ENABLED, requireMinimumServerRolle())

type AuthArgs = { userId: string }
type AuthFunction = (args: AuthArgs) => Promise<AuthResult>

const authPipelineFactory = (functions: AuthFunction[]) => async (args: AuthArgs): Promise<AuthResult> => {

  for (const step of functions) {
    const result = await step(args)
    if (result !== null) return result
  }
  return true
}

// globalAuthThing.requestAuthInfo({ userId, projectId })

type ProjectVisibility = 'public' | 'linkShareable' | 'private'

const requireProjectVisibilityFactory =
  (config: { projectVisibility: ProjectVisibility, project: Project }): AuthFunction =>
    () => {
      // this is not a good check, we need an error for this later
      if (config.projectVisibility === 'linkShareable' && config.project.isDiscoverable) return Promise.resolve(true)
      if (config.projectVisibility === 'public' && config.project.isPublic) return Promise.resolve(true)
      if (config.projectVisibility === 'private' && !config.project.isPublic && !config.project.isPublic) return Promise.resolve(true)
      return Promise.resolve(true)
    }


const hasMinimumProjectRoleFactory =
  (config: { minimumRole: ProjectRoles, projectId: string }, loaders: { getProjectRole: GetProjectRole }): AuthFunction =>
    async ({ userId }) => {
      const userRole = await loaders.getProjectRole({ userId, projectId: config.projectId })

      if (!userRole) return false
      return userRole.role === config.minimumRole
    }

const hasMinimumServerRoleFactory =
  (config: { minimumRole: ServerRoles }, loaders: { getServerRole: GetServerRole }): AuthFunction =>
    async (args) => {
      const userRole = await loaders.getServerRole(args)

      if (!userRole) return false
      return userRole.role === config.minimumRole
    }

const hasMinimumWorkspaceRoleFactory =
  (config: { minimumRole: WorkspaceRoles, workspaceId: string }, loaders: { getWorkspaceRole: GetWorkspaceRole }): AuthFunction =>
    async (args) => {
      const userRole = await loaders.getWorkspaceRole({ ...args, workspaceId: config.workspaceId })

      if (!userRole) return false
      return userRole.role === config.minimumRole
    }


const imOkToContinueIfFalse = (authFunction: AuthFunction): AuthFunction => async (args) => {
  const authResult = await authFunction(args)
  if (authResult) return authResult
  // just overrides to null
  return null
}

