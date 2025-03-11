import { WorkspaceSeat } from '@/modules/gatekeeper/domain/billing'
import { getWorkspaceUserSeatsFactory } from '@/modules/gatekeeper/repositories/workspaceSeat'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { defineRequestDataloaders } from '@/modules/shared/helpers/graphqlHelper'
import DataLoader from 'dataloader'

const { FF_GATEKEEPER_MODULE_ENABLED } = getFeatureFlags()

declare module '@/modules/core/loaders' {
  interface ModularizedDataLoaders
    extends Partial<ReturnType<typeof dataLoadersDefinition>> {}
}

const dataLoadersDefinition = defineRequestDataloaders(
  ({ createLoader, deps: { db } }) => {
    const getUserSeats = getWorkspaceUserSeatsFactory({ db })

    return {
      gatekeeper: {
        getUserWorkspaceSeatType: (() => {
          type LoaderType = DataLoader<string, WorkspaceSeat | null>
          const workspaceLoaders = new Map<string, LoaderType>()
          return {
            clearAll: () => workspaceLoaders.clear(),
            forWorkspace(workspaceId: string): LoaderType {
              let loader = workspaceLoaders.get(workspaceId)
              if (!loader) {
                loader = createLoader<string, WorkspaceSeat | null>(async (ids) => {
                  const results = await getUserSeats({
                    userIds: ids.slice(),
                    workspaceId
                  })
                  return ids.map((id) => results[id] || null)
                })
                workspaceLoaders.set(workspaceId, loader)
              }

              return loader
            }
          }
        })()
      }
    }
  }
)

export default FF_GATEKEEPER_MODULE_ENABLED ? dataLoadersDefinition : undefined
