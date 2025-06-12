import { StreamRoles } from '../../core/index.js'
import { AuthPolicyCheck } from '../domain/policies.js'
import { isMinimumProjectRole } from '../domain/logic/roles.js'
import { ProjectContext, UserContext } from '../domain/context.js'
import { ProjectVisibility } from '../domain/projects/types.js'

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
    return project.visibility === ProjectVisibility.Public
  }
