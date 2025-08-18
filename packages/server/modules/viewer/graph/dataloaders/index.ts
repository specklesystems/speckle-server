import { defineRequestDataloaders } from '@/modules/shared/helpers/graphqlHelper'
import type {
  SavedView,
  SavedViewGroup
} from '@/modules/viewer/domain/types/savedViews'
import {
  getModelHomeSavedViewsFactory,
  getSavedViewGroupsFactory,
  getSavedViewsFactory
} from '@/modules/viewer/repositories/savedViews'
import type { Nullable } from '@speckle/shared'

declare module '@/modules/core/loaders' {
  interface ModularizedDataLoaders extends ReturnType<typeof dataLoadersDefinition> {}
}

const dataLoadersDefinition = defineRequestDataloaders(
  ({ createLoader, deps: { db } }) => {
    const getSavedViewGroups = getSavedViewGroupsFactory({ db })
    const getSavedViews = getSavedViewsFactory({ db })

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
        ),
        /**
         * Get saved view by its ID
         */
        getSavedView: createLoader<
          { viewId: string; projectId: string },
          Nullable<SavedView>,
          string
        >(
          async (ids) => {
            const views = await getSavedViews({ viewIds: ids.slice() })
            return ids.map(({ viewId }) => views[viewId] || null)
          },
          {
            cacheKeyFn: ({ viewId, projectId }) => `${viewId}-${projectId}`
          }
        ),
        getModelHomeSavedView: createLoader<
          { modelId: string; projectId: string },
          Nullable<SavedView>,
          string
        >(
          async (ids) => {
            const views = await getModelHomeSavedViewsFactory({ db })({
              requests: ids.slice()
            })
            return ids.map(({ modelId }) => views[modelId] || null)
          },
          {
            cacheKeyFn: ({ modelId, projectId }) => `${modelId}-${projectId}`
          }
        )
      }
    }
  }
)

export default dataLoadersDefinition
