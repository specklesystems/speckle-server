import type { GetPaginatedProjectModelsTotalCount } from '@/modules/core/domain/branches/operations'
import type { QueryAllProjects } from '@/modules/core/domain/projects/operations'
import type { GetWorkspaceModelCount } from '@/modules/workspaces/domain/operations'

// TODO: Optimize with single model count query per regional db
export const getWorkspaceModelCountFactory =
  (deps: {
    queryAllProjects: QueryAllProjects
    getPaginatedProjectModelsTotalCount: GetPaginatedProjectModelsTotalCount
  }): GetWorkspaceModelCount =>
  async ({ workspaceId }) => {
    let modelCount = 0

    for await (const projects of deps.queryAllProjects({ workspaceId })) {
      for (const project of projects) {
        modelCount =
          modelCount + (await deps.getPaginatedProjectModelsTotalCount(project.id, {}))
      }
    }

    return modelCount
  }
