import { GetPaginatedProjectModelsTotalCount } from '@/modules/core/domain/branches/operations'
import {
  GetWorkspaceModelCount,
  QueryAllWorkspaceProjects
} from '@/modules/workspaces/domain/operations'

// TODO: Optimize with single model count query per regional db
export const getWorkspaceModelCountFactory =
  (deps: {
    queryAllWorkspaceProjects: QueryAllWorkspaceProjects
    getPaginatedProjectModelsTotalCount: GetPaginatedProjectModelsTotalCount
  }): GetWorkspaceModelCount =>
  async ({ workspaceId }) => {
    let modelCount = 0

    for await (const projects of deps.queryAllWorkspaceProjects({ workspaceId })) {
      for (const project of projects) {
        modelCount =
          modelCount + (await deps.getPaginatedProjectModelsTotalCount(project.id, {}))
      }
    }

    return modelCount
  }
