import { isMinimumProjectRole } from '../../domain/projects/logic.js'
import { GetProject, GetProjectRole } from '../../domain/projects/operations.js'
import { ProjectRole, ProjectVisibility } from '../../domain/projects/types.js'
import { AuthFunction } from '../../domain/types.js'

export const requireExactProjectVisibility =
  (
    context: {
      projectVisibility: ProjectVisibility
      projectId: string
    },
    deps: {
      getProject: GetProject
    }
  ): AuthFunction =>
  async () => {
    const { projectId, projectVisibility } = context

    const project = await deps.getProject({ projectId })

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
    }

    return {
      authorized: false,
      reason: `Invalid visibility \`${projectVisibility}\` provided`
    }
  }

export const requireMinimumProjectRole =
  (
    context: {
      projectId: string
      role: ProjectRole
    },
    deps: {
      getProjectRole: GetProjectRole
    }
  ): AuthFunction =>
  async ({ userId }) => {
    const { projectId, role: requiredProjectRole } = context

    const userProjectRole = await deps.getProjectRole({ userId, projectId })

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
