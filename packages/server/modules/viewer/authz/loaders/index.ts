import { defineModuleLoaders } from '@/modules/loaders'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'

export default defineModuleLoaders(async () => {
  return {
    getSavedView: async ({ savedViewId, projectId }, { dataLoaders }) => {
      const projectDb = await getProjectDbClient({ projectId })
      return await dataLoaders
        .forRegion({ db: projectDb })
        .savedViews.getSavedView.load({
          viewId: savedViewId,
          projectId
        })
    }
  }
})
