import { StreamRoles, throwUncoveredError } from '../../core/index.js'
import { AuthPolicyCheck, ProjectContext, UserContext } from '../domain/policies.js'
import { isMinimumProjectRole } from '../domain/logic/roles.js'

export const hasMinimumProjectRole: AuthPolicyCheck<
  'getProjectRole',
  UserContext & ProjectContext & { role: StreamRoles }
> =
  (loaders) =>
  async ({ userId, projectId, role: requiredProjectRole }) => {
    const userProjectRole = await loaders.getProjectRole({ userId, projectId })
    if (userProjectRole.isErr) {
      switch (userProjectRole.error.code) {
        case 'ProjectRoleNotFound':
          return false
        default:
          throwUncoveredError(userProjectRole.error.code)
      }
    }
    return isMinimumProjectRole(userProjectRole.value, requiredProjectRole)
  }

export const isPubliclyReadableProject: AuthPolicyCheck<'getProject', ProjectContext> =
  (loaders) =>
  async ({ projectId }) => {
    const project = await loaders.getProject({ projectId })
    if (project.isErr) {
      switch (project.error.code) {
        case 'ProjectNotFound':
          return false
        case 'ProjectNoAccess':
          return false
        case 'WorkspaceSsoSessionNoAccess':
          return false
        default:
          throwUncoveredError(project.error)
      }
    }
    return project.value.isPublic || project.value.isDiscoverable
  }
