import { WorkspaceSeat } from '@/modules/gatekeeper/domain/billing'
import {
  getProjectsUsersSeatsFactory,
  getWorkspacesUsersSeatsFactory
} from '@/modules/gatekeeper/repositories/workspaceSeat'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { defineRequestDataloaders } from '@/modules/shared/helpers/graphqlHelper'

const { FF_GATEKEEPER_MODULE_ENABLED } = getFeatureFlags()

declare module '@/modules/core/loaders' {
  interface ModularizedDataLoaders
    extends Partial<ReturnType<typeof dataLoadersDefinition>> {}
}

const dataLoadersDefinition = defineRequestDataloaders(
  ({ createLoader, deps: { db } }) => {
    const getWorkspacesUsersSeats = getWorkspacesUsersSeatsFactory({ db })
    const getProjectsUsersSeats = getProjectsUsersSeatsFactory({ db })

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
        )
      }
    }
  }
)

export default FF_GATEKEEPER_MODULE_ENABLED ? dataLoadersDefinition : undefined
