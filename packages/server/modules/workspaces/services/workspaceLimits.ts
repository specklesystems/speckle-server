import { getPaginatedProjectModelsTotalCountFactory } from '@/modules/core/repositories/branches'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import {
  GetWorkspaceModelCount,
  QueryAllWorkspaceProjects
} from '@/modules/workspaces/domain/operations'

// TODO: What is correct DI for a service that has to dynamically select a regional database?
export const getWorkspaceModelCountFactory =
  (deps: {
    queryAllWorkspaceProjects: QueryAllWorkspaceProjects
  }): GetWorkspaceModelCount =>
  async ({ workspaceId }) => {
    let modelCount = 0

    for await (const projects of deps.queryAllWorkspaceProjects({ workspaceId })) {
      for (const project of projects) {
        const regionDb = await getProjectDbClient({ projectId: project.id })
        const projectModelCount = await getPaginatedProjectModelsTotalCountFactory({
          db: regionDb
        })(project.id, {
          filter: {
            onlyWithVersions: true
          }
        })
        modelCount = modelCount + projectModelCount
      }
    }

    return modelCount
  }
