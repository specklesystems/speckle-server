import { throwUncoveredError } from '../../core/index.js'
import { ChuckContext } from '../domain/loaders.js'
import { isMinimumProjectRole } from '../domain/projects/logic.js'
import { ProjectRole, ProjectVisibility } from '../domain/projects/types.js'
import { CheckResult } from '../domain/types.js'
import { checkResult } from '../helpers/result.js'

export const requireExactProjectVisibility =
  ({ loaders }: ChuckContext<'getProject'>) =>
  async (args: {
    projectVisibility: ProjectVisibility
    projectId: string
  }): Promise<CheckResult> => {
    const { projectId, projectVisibility } = args

    const project = await loaders.getProject({ projectId })

    switch (projectVisibility) {
      case 'linkShareable': {
        const isLinkShareable = project?.isDiscoverable === true

        return isLinkShareable
          ? checkResult.pass()
          : checkResult.fail('Specified project is not link-shareable.')
      }
      case 'public': {
        const isPublic = project?.isPublic === true

        return isPublic
          ? checkResult.pass()
          : checkResult.fail('Specified project is not public.')
      }
      case 'private': {
        const isPrivate = project?.isPublic !== true

        return isPrivate
          ? checkResult.pass()
          : checkResult.fail('Specified project is not private.')
      }
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
  }): Promise<CheckResult> => {
    const { userId, projectId, role: requiredProjectRole } = args

    const userProjectRole = await loaders.getProjectRole({ userId, projectId })

    if (!userProjectRole) return checkResult.fail('User does not have role in project.')

    return isMinimumProjectRole(userProjectRole, requiredProjectRole)
      ? checkResult.pass()
      : checkResult.fail(
          `User does not have minimum role \`${requiredProjectRole}\` in project \`${projectId}\`.`
        )
  }
