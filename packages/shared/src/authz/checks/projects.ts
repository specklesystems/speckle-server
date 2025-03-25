import { StreamRoles, throwUncoveredError } from '../../core/index.js'
import { ProjectNotFoundError } from '../domain/errors.js'
import { AuthCheckContext } from '../domain/loaders.js'
import { isMinimumProjectRole } from '../domain/projects/logic.js'
import { ProjectVisibility } from '../domain/projects/types.js'

export const requireExactProjectVisibilityFactory =
  ({ loaders }: AuthCheckContext<'getProject'>) =>
  async (args: {
    projectVisibility: ProjectVisibility
    projectId: string
  }): Promise<boolean> => {
    const { projectId, projectVisibility } = args

    const project = await loaders.getProject({ projectId })
    if (!project) throw new ProjectNotFoundError({ projectId })

    switch (projectVisibility) {
      case 'linkShareable':
        return project.isDiscoverable === true
      case 'public':
        return project.isPublic === true
      case 'private':
        return project.isPublic !== true && project.isDiscoverable !== true
      default:
        throwUncoveredError(projectVisibility)
    }
  }

export const requireMinimumProjectRoleFactory =
  ({ loaders }: AuthCheckContext<'getProjectRole'>) =>
  async (args: {
    userId: string
    projectId: string
    role: StreamRoles
  }): Promise<boolean> => {
    const { userId, projectId, role: requiredProjectRole } = args

    const userProjectRole = await loaders.getProjectRole({ userId, projectId })
    return userProjectRole
      ? isMinimumProjectRole(userProjectRole, requiredProjectRole)
      : false
  }
