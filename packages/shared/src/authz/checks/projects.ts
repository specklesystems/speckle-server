import { StreamRoles, throwUncoveredError } from '../../core/index.js'
import { ProjectNotFoundError } from '../domain/errors.js'
import { AuthCheckContext, AuthCheckContextLoaderKeys } from '../domain/loaders.js'
import { isMinimumProjectRole } from '../domain/projects/logic.js'
import { ProjectVisibility } from '../domain/projects/types.js'

export const requireExactProjectVisibilityFactory =
  ({ loaders }: AuthCheckContext<typeof AuthCheckContextLoaderKeys.getProject>) =>
  async (args: {
    projectVisibility: ProjectVisibility
    projectId: string
  }): Promise<boolean> => {
    const { projectId, projectVisibility } = args

    const project = await loaders.getProject({ projectId })
    if (!project.isOk) throw new ProjectNotFoundError({ projectId })

    switch (projectVisibility) {
      case 'linkShareable':
        return project.value.isDiscoverable === true
      case 'public':
        return project.value.isPublic === true
      case 'private':
        return project.value.isPublic !== true && project.value.isDiscoverable !== true
      default:
        throwUncoveredError(projectVisibility)
    }
  }

export const requireMinimumProjectRoleFactory =
  ({ loaders }: AuthCheckContext<typeof AuthCheckContextLoaderKeys.getProjectRole>) =>
  async (args: {
    userId: string
    projectId: string
    role: StreamRoles
  }): Promise<boolean> => {
    const { userId, projectId, role: requiredProjectRole } = args

    const userProjectRole = await loaders.getProjectRole({ userId, projectId })
    return userProjectRole.isOk
      ? isMinimumProjectRole(userProjectRole.value, requiredProjectRole)
      : false
  }
