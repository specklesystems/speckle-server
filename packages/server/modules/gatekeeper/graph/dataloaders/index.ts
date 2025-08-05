import type { WorkspaceSeat } from '@/modules/gatekeeper/domain/billing'
import { getWorkspacePlansByWorkspaceIdFactory } from '@/modules/gatekeeper/repositories/billing'
import {
  getProjectsUsersSeatsFactory,
  getWorkspacesUsersSeatsFactory
} from '@/modules/gatekeeper/repositories/workspaceSeat'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { defineRequestDataloaders } from '@/modules/shared/helpers/graphqlHelper'
import type { WorkspaceLimits, WorkspacePlan } from '@speckle/shared'
import { WorkspacePaidPlanConfigs, WorkspaceUnpaidPlanConfigs } from '@speckle/shared'

const { FF_GATEKEEPER_MODULE_ENABLED } = getFeatureFlags()

declare module '@/modules/core/loaders' {
  interface ModularizedDataLoaders
    extends Partial<ReturnType<typeof dataLoadersDefinition>> {}
}

const dataLoadersDefinition = defineRequestDataloaders(
  ({ createLoader, deps: { db } }) => {
    const getWorkspacesUsersSeats = getWorkspacesUsersSeatsFactory({ db })
    const getProjectsUsersSeats = getProjectsUsersSeatsFactory({ db })
    const getWorkspacePlansByWorkspaceId = getWorkspacePlansByWorkspaceIdFactory({ db })

    return {
      gatekeeper: {
        getUserWorkspaceSeat: createLoader<
          { workspaceId: string; userId: string },
          WorkspaceSeat | null,
          string
        >(
          async (requests) => {
            const results = await getWorkspacesUsersSeats({
              requests: requests.slice()
            })

            return requests.map(
              ({ workspaceId, userId }) => results[workspaceId]?.[userId] || null
            )
          },
          {
            cacheKeyFn: ({ workspaceId, userId }) => `${workspaceId}-${userId}`
          }
        ),
        getUserProjectSeat: createLoader<
          { projectId: string; userId: string },
          WorkspaceSeat | null,
          string
        >(
          async (requests) => {
            const results = await getProjectsUsersSeats({
              requests: requests.slice()
            })

            return requests.map(
              ({ projectId, userId }) => results[projectId]?.[userId] || null
            )
          },
          {
            cacheKeyFn: ({ projectId, userId }) => `${projectId}-${userId}`
          }
        ),
        getWorkspacePlan: createLoader<
          { workspaceId: string },
          WorkspacePlan | null,
          string
        >(
          async (requests) => {
            const results = await getWorkspacePlansByWorkspaceId({
              workspaceIds: requests.map((request) => request.workspaceId)
            })

            return requests.map(({ workspaceId }) => results[workspaceId] || null)
          },
          {
            cacheKeyFn: ({ workspaceId }) => workspaceId
          }
        ),
        getWorkspaceLimits: createLoader<string, WorkspaceLimits | null>(
          async (workspaceIds) => {
            const workspacePlans = await getWorkspacePlansByWorkspaceId({
              workspaceIds: workspaceIds.slice()
            })
            const featureFlags = getFeatureFlags()

            return workspaceIds.map((workspaceId) => {
              const plan = workspacePlans[workspaceId]
              if (!plan) return null

              const config = {
                ...WorkspacePaidPlanConfigs({ featureFlags }),
                ...WorkspaceUnpaidPlanConfigs({ featureFlags })
              }
              return config[plan.name]?.limits || null
            })
          }
        )
      }
    }
  }
)

export default FF_GATEKEEPER_MODULE_ENABLED ? dataLoadersDefinition : undefined
