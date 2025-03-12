import { throwUncoveredError } from '../../core/index.js'
import { ChuckContext } from '../domain/loaders.js'
import { isMinimumProjectRole } from '../domain/projects/logic.js'
import { ProjectRole, ProjectVisibility } from '../domain/projects/types.js'

export const requireExactProjectVisibility =
  ({ loaders }: ChuckContext<'getProject'>) =>
  async (args: {
    projectVisibility: ProjectVisibility
    projectId: string
  }): Promise<boolean> => {
    const { projectId, projectVisibility } = args

    const project = await loaders.getProject({ projectId })

    switch (projectVisibility) {
      case 'linkShareable':
        return project?.isDiscoverable === true
      case 'public':
        return project?.isPublic === true
      case 'private':
        return project?.isPublic !== true
      default:
        throwUncoveredError(projectVisibility)
    }
  }

export const requireMinimumProjectRole =
  ({ loaders }: ChuckContext<'getProjectRole'>) =>
  async (args: {
    userId: string
    projectId: string
    role: ProjectRole
  }): Promise<boolean> => {
    const { userId, projectId, role: requiredProjectRole } = args

    const userProjectRole = await loaders.getProjectRole({ userId, projectId })
    return userProjectRole
      ? isMinimumProjectRole(userProjectRole, requiredProjectRole)
      : false
    // ? checkResult.pass()
    // : checkResult.fail(
    //     `User does not have minimum role \`${requiredProjectRole}\` in project \`${projectId}\`.`
    //   )
  }
