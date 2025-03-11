import { throwUncoveredError } from "../../core/index.js"
import { ChuckContextLoaders } from "../domain/loaders.js"
import { isMinimumProjectRole } from "../domain/projects/logic.js"
import { ProjectRole, ProjectVisibility } from "../domain/projects/types.js"
import { AuthFunction, AuthResult } from "../domain/types.js"

export const requireExactProjectVisibility =
  ({ loaders }: {
    loaders: Pick<ChuckContextLoaders, 'getProject'>
  }
  ) =>
    async (
      args: {
        projectVisibility: ProjectVisibility
        projectId: string
      }
    ): Promise<AuthResult> => {
      const { projectId, projectVisibility } = args

      const project = await loaders.getProject({ projectId })

      switch (projectVisibility) {
        case 'linkShareable': {
          const isLinkShareable = project?.isDiscoverable === true

          return isLinkShareable
            ? {
              authorized: true
            }
            : {
              authorized: false,
              reason: `Specified project is not ${projectVisibility}`
            }
        }
        case 'public': {
          const isPublic = project?.isPublic === true

          return isPublic
            ? {
              authorized: true
            }
            : {
              authorized: false,
              reason: `Specified project is not ${projectVisibility}`
            }
        }
        case 'private': {
          const isPrivate = project?.isPublic !== true

          return isPrivate
            ? {
              authorized: true
            }
            : {
              authorized: false,
              reason: `Specified project is not ${projectVisibility}`
            }
        }
        default:
          throwUncoveredError(projectVisibility)
      }
    }

export const requireMinimumProjectRole =
  (
    context: {
      projectId: string
      role: ProjectRole
    },
    loaders: Pick<ChuckContextLoaders, 'getProject' | 'getProjectRole'>
  ): AuthFunction =>
    async ({ userId }) => {
      const { projectId, role: requiredProjectRole } = context

      const userProjectRole = await loaders.getProjectRole({ userId, projectId })

      if (!userProjectRole) {
        return {
          authorized: false,
          reason: `User does not have role in project`
        }
      }

      return isMinimumProjectRole(userProjectRole, requiredProjectRole)
        ? {
          authorized: true
        }
        : {
          authorized: false,
          reason: `User does not have minimum role \`${requiredProjectRole}\` in project \`${projectId}\``
        }
    }
