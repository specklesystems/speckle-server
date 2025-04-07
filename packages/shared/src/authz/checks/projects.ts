import { Roles, StreamRoles } from '../../core/index.js'
import { AuthPolicyCheck } from '../domain/policies.js'
import { isMinimumProjectRole } from '../domain/logic/roles.js'
import { ProjectContext, UserContext } from '../domain/context.js'
import { Loaders } from '../domain/loaders.js'

export const hasMinimumProjectRole: AuthPolicyCheck<
  'getProjectRole',
  UserContext & ProjectContext & { role: StreamRoles }
> =
  (loaders) =>
  async ({ userId, projectId, role: requiredProjectRole }) => {
    const userProjectRole = await loaders.getProjectRole({ userId, projectId })
    if (!userProjectRole) return false
    return isMinimumProjectRole(userProjectRole, requiredProjectRole)
  }

export const isPubliclyReadableProject: AuthPolicyCheck<'getProject', ProjectContext> =
  (loaders) =>
  async ({ projectId }) => {
    const project = await loaders.getProject({ projectId })
    if (!project) return false
    return project.isPublic || project.isDiscoverable
  }

const workspaceRoleImplicitProjectRoleMap = <const>{
  [Roles.Workspace.Admin]: Roles.Stream.Owner,
  [Roles.Workspace.Member]: Roles.Stream.Reviewer,
  [Roles.Workspace.Guest]: null
}

export const hasMinimumImplicitWorkspaceProjectRole: AuthPolicyCheck<
  typeof Loaders.getWorkspaceRole | typeof Loaders.getProject,
  UserContext & ProjectContext & { role: StreamRoles }
> =
  (loaders) =>
  async ({ userId, projectId, role: requiredProjectRole }) => {
    const project = await loaders.getProject({ projectId })
    if (!project) return false

    const { workspaceId } = project
    if (!workspaceId) return false

    const userWorkspaceRole = await loaders.getWorkspaceRole({ userId, workspaceId })
    if (!userWorkspaceRole) return false

    const implicitProjectRole = workspaceRoleImplicitProjectRoleMap[userWorkspaceRole]
    if (!implicitProjectRole) return false

    return isMinimumProjectRole(implicitProjectRole, requiredProjectRole)
  }
