import { ProjectRole, ServerRole } from "./domain.js"
import { isMinimumProjectRole, isMinimumServerRole } from "./helpers.js"
import { GetProjectRole, GetServerRole } from "./loaders.js"
import { AuthFunction } from "./types.js"

export const requireMinimumProjectRoleFactory =
  (context: {
    minimumRole: ProjectRole
    projectId: string
  },
    deps: {
      getProjectRole: GetProjectRole
    }): AuthFunction =>
    async ({ userId }) => {
      const userProjectRole = await deps.getProjectRole({ userId, projectId: context.projectId })
      return isMinimumProjectRole(userProjectRole, context.minimumRole)
    }

export const requireMinimumServerRoleFactory =
  (context: {
    minimumRole: ServerRole
  },
    deps: {
      getServerRole: GetServerRole
    }): AuthFunction =>
    async ({ userId }) => {
      const userServerRole = await deps.getServerRole({ userId })
      return isMinimumServerRole(userServerRole, context.minimumRole)
    }