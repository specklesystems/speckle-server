import { db } from '@/db/knex'
import { getPaginatedProjectModelsTotalCountFactory } from '@/modules/core/repositories/branches'
import { legacyGetStreamsFactory } from '@/modules/core/repositories/streams'
import { getWorkspacePlanFactory } from '@/modules/gatekeeper/repositories/billing'
import { defineModuleLoaders } from '@/modules/loaders'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import {
  getUserSsoSessionFactory,
  getWorkspaceSsoProviderRecordFactory
} from '@/modules/workspaces/repositories/sso'
import { getWorkspaceRoleForUserFactory } from '@/modules/workspaces/repositories/workspaces'
import { queryAllWorkspaceProjectsFactory } from '@/modules/workspaces/services/projects'
import { getWorkspaceModelCountFactory } from '@/modules/workspaces/services/workspaceLimits'
import { WorkspacePaidPlanConfigs, WorkspaceUnpaidPlanConfigs } from '@speckle/shared'

// TODO: Move everything to use dataLoaders
export default defineModuleLoaders(async () => {
  const getWorkspacePlan = getWorkspacePlanFactory({ db })

  return {
    getWorkspace: async ({ workspaceId }, { dataLoaders }) => {
      return (await dataLoaders.workspaces!.getWorkspace.load(workspaceId)) || null
    },
    getWorkspaceRole: async ({ userId, workspaceId }) => {
      const role = await getWorkspaceRoleForUserFactory({ db })({
        userId,
        workspaceId
      })
      return role?.role || null
    },
    getWorkspaceSsoSession: async ({ userId, workspaceId }) => {
      const ssoSession = await getUserSsoSessionFactory({ db })({
        userId,
        workspaceId
      })
      return ssoSession || null
    },
    getWorkspaceSsoProvider: async ({ workspaceId }) => {
      const ssoProvider = await getWorkspaceSsoProviderRecordFactory({ db })({
        workspaceId
      })
      return ssoProvider || null
    },
    getWorkspaceSeat: async ({ userId, workspaceId }, { dataLoaders }) => {
      return (
        (
          await dataLoaders.gatekeeper!.getUserWorkspaceSeat.load({
            userId,
            workspaceId
          })
        )?.type || null
      )
    },
    getWorkspaceModelCount: async ({ workspaceId }) => {
      // TODO: Dataloader that has to dynamically pick regional dbs?
      return await getWorkspaceModelCountFactory({
        queryAllWorkspaceProjects: queryAllWorkspaceProjectsFactory({
          getStreams: legacyGetStreamsFactory({ db })
        }),
        getPaginatedProjectModelsTotalCount: async (projectId, params) => {
          const regionDb = await getProjectDbClient({ projectId })
          return await getPaginatedProjectModelsTotalCountFactory({ db: regionDb })(
            projectId,
            params
          )
        }
      })({ workspaceId })
    },
    getWorkspaceProjectCount: async ({ workspaceId }, { dataLoaders }) => {
      return await dataLoaders.workspaces!.getProjectCount.load(workspaceId)
    },
    getWorkspacePlan: async ({ workspaceId }) => {
      return await getWorkspacePlan({ workspaceId })
    },
    getWorkspaceLimits: async ({ workspaceId }) => {
      const plan = await getWorkspacePlan({ workspaceId })
      if (!plan) return null
      const config = { ...WorkspacePaidPlanConfigs, ...WorkspaceUnpaidPlanConfigs }
      return config[plan.name]?.limits ?? null
    }
  }
})
