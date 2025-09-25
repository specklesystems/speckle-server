import type {
  GetSavedView,
  OutputSavedViewPreview
} from '@/modules/viewer/domain/operations/savedViews'
import { SavedViewPreviewRetrievalError } from '@/modules/viewer/errors/savedViews'

export const outputSavedViewPreviewFactory =
  (deps: { getSavedView: GetSavedView }): OutputSavedViewPreview =>
  async (params) => {
    const { res, projectId, viewId } = params
    const view = await deps.getSavedView({ projectId, id: viewId })
    if (!view) {
      throw new SavedViewPreviewRetrievalError('Could not find view', {
        info: { projectId, viewId }
      })
    }

    // no `data:image/png;base64,` prefix
    const preview = view.screenshot.replace(/^data:image\/png;base64,/, '')
    const imgBuffer = Buffer.from(preview, 'base64')

    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': imgBuffer.length,
      'Cache-Control': 'no-cache, no-store'
    })

    res.end(imgBuffer)
  }
