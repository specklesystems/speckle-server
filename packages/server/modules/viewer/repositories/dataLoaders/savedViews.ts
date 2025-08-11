import type { RequestDataLoaders } from '@/modules/core/loaders'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import type {
  GetSavedView,
  GetSavedViewGroup
} from '@/modules/viewer/domain/operations/savedViews'

export const getSavedViewFactory =
  (deps: { loaders: RequestDataLoaders }): GetSavedView =>
  async ({ id, projectId }) => {
    const projectDb = await getProjectDbClient({ projectId })
    return (
      (await deps.loaders.forRegion({ db: projectDb }).savedViews.getSavedView.load({
        viewId: id,
        projectId
      })) || undefined
    )
  }

export const getSavedViewGroupFactory =
  (deps: { loaders: RequestDataLoaders }): GetSavedViewGroup =>
  async ({ id, projectId }) => {
    const projectDb = await getProjectDbClient({ projectId })
    return (
      (await deps.loaders
        .forRegion({ db: projectDb })
        .savedViews.getSavedViewGroup.load({
          groupId: id,
          projectId
        })) || undefined
    )
  }
