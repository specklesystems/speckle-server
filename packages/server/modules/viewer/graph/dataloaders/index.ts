import { defineRequestDataloaders } from '@/modules/shared/helpers/graphqlHelper'
import type { SavedViewGroup } from '@/modules/viewer/domain/types/savedViews'
import { getSavedViewGroupsFactory } from '@/modules/viewer/repositories/savedViews'
import type { Nullable } from '@speckle/shared'

declare module '@/modules/core/loaders' {
  interface ModularizedDataLoaders extends ReturnType<typeof dataLoadersDefinition> {}
}

const dataLoadersDefinition = defineRequestDataloaders(
  ({ createLoader, deps: { db } }) => {
    const getSavedViewGroups = getSavedViewGroupsFactory({ db })
    return {
      savedViews: {
        /**
         * Get a saved view group by ID. Can also handle unpersisted ungrouped groups, just make sure
         * you use their encoded IDs.
         */
        getSavedViewGroup: createLoader<
          { groupId: string; projectId: string },
          Nullable<SavedViewGroup>,
          string
        >(
          async (ids) => {
            const groups = await getSavedViewGroups({ groupIds: ids.slice() })
            return ids.map(({ groupId }) => groups[groupId] || null)
          },
          {
            cacheKeyFn: ({ groupId, projectId }) => `${groupId}-${projectId}`
          }
        )
      }
    }
  }
)

export default dataLoadersDefinition
