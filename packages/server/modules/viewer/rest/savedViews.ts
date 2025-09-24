import { Router } from 'express'
import cors from 'cors'
import { allowCrossOriginResourceAccessMiddelware } from '@/modules/shared/middleware/security'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { SavedViewPreviewRetrievalError } from '@/modules/viewer/errors/savedViews'
import { outputSavedViewPreviewFactory } from '@/modules/viewer/services/savedViewPreviews'
import { getSavedViewFactory } from '@/modules/viewer/repositories/savedViews'
import { SavedViewPreviewType } from '@/modules/viewer/domain/operations/savedViews'

export const getSavedViewsRouter = (): Router => {
  const router = Router()

  const buildPreviewRoute = (type: SavedViewPreviewType, route: string) => {
    router.options(route, cors(), allowCrossOriginResourceAccessMiddelware())
    router.get(
      route,
      cors(),
      allowCrossOriginResourceAccessMiddelware(),
      async (req, res) => {
        const projectId = req.params.projectId
        const viewId = req.params.viewId
        if (!projectId || !viewId) {
          throw new SavedViewPreviewRetrievalError(
            'Either projectId or viewId is missing'
          )
        }

        const projectDb = await getProjectDbClient({ projectId })
        const outputSavedViewPreview = outputSavedViewPreviewFactory({
          getSavedView: getSavedViewFactory({ db: projectDb })
        })

        await outputSavedViewPreview({ res, projectId, viewId, type })
      }
    )
  }

  const thumbnailRoute = '/api/v1/projects/:projectId/saved-views/:viewId/thumbnail'
  buildPreviewRoute(SavedViewPreviewType.thumbnail, thumbnailRoute)

  const fullPreviewRoute = '/api/v1/projects/:projectId/saved-views/:viewId/preview'
  buildPreviewRoute(SavedViewPreviewType.preview, fullPreviewRoute)

  return router
}
