import type { ErrorRequestHandler, Request, Response } from 'express'
import { Router } from 'express'
import cors from 'cors'
import { allowCrossOriginResourceAccessMiddelware } from '@/modules/shared/middleware/security'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import { outputSavedViewPreviewFactory } from '@/modules/viewer/services/savedViewPreviews'
import { getSavedViewFactory } from '@/modules/viewer/repositories/savedViews'
import { SavedViewPreviewType } from '@/modules/viewer/domain/operations/savedViews'
import { ensureError } from '@speckle/shared'
import { resolveStatusCode } from '@/modules/core/rest/defaultErrorHandler'
import { fileURLToPath } from 'node:url'
import { buildAuthPolicies } from '@/modules'
import { throwIfAuthNotOk } from '@/modules/shared/helpers/errorHelper'
import { StreamNotFoundError } from '@/modules/core/errors/stream'
import { NotFoundError } from '@/modules/shared/errors'
import { fullPreviewRoute, thumbnailRoute } from '@/modules/viewer/helpers/savedViews'

const previewErrorPath = () =>
  fileURLToPath(import.meta.resolve('#/assets/previews/images/preview_error.png'))
const preview404Path = () =>
  fileURLToPath(import.meta.resolve('#/assets/previews/images/preview_404.png'))
const preview401Path = () =>
  fileURLToPath(import.meta.resolve('#/assets/previews/images/preview_401.png'))

const previewErrHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (!err) return next()

  // Return failure image, instead of throwing
  const error = ensureError(err)
  const status = resolveStatusCode(error)
  res.header('X-Error-Message', error.message)
  res.status(status)

  if (error instanceof StreamNotFoundError || error instanceof NotFoundError) {
    return res.sendFile(preview404Path())
  } else if (status === 401) {
    return res.sendFile(preview401Path())
  } else {
    return res.sendFile(previewErrorPath())
  }
}

const buildPreviewRoute = (
  router: Router,
  type: SavedViewPreviewType,
  route: string
) => {
  router.options(route, cors(), allowCrossOriginResourceAccessMiddelware())
  router.get(
    route,
    cors(),
    allowCrossOriginResourceAccessMiddelware(),
    async (req: Request, res: Response) => {
      const projectId = req.params.projectId
      const viewId = req.params.viewId

      // Access check
      const authz = await buildAuthPolicies({
        authContext: req.context
      })
      const authResults = await Promise.all([
        authz.project.canRead({
          userId: req.context.userId,
          projectId
        }),
        authz.project.savedViews.canRead({
          userId: req.context.userId,
          projectId,
          savedViewId: viewId,
          allowNonExistent: true // we check inside the service layer anyway
        })
      ])
      authResults.forEach(throwIfAuthNotOk)

      // Access is fine - look for the view
      const projectDb = await getProjectDbClient({ projectId })
      const outputSavedViewPreview = outputSavedViewPreviewFactory({
        getSavedView: getSavedViewFactory({ db: projectDb })
      })

      await outputSavedViewPreview({ res, projectId, viewId, type })
    },
    previewErrHandler
  )
}

export const getSavedViewsRouter = (): Router => {
  const router = Router()

  buildPreviewRoute(router, SavedViewPreviewType.thumbnail, thumbnailRoute)
  buildPreviewRoute(router, SavedViewPreviewType.preview, fullPreviewRoute)

  return router
}
