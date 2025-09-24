import type {
  GetSavedView,
  OutputSavedViewPreview
} from '@/modules/viewer/domain/operations/savedViews'
import { SavedViewPreviewRetrievalError } from '@/modules/viewer/errors/savedViews'

export const outputSavedViewPreviewFactory =
  (deps: { getSavedView: GetSavedView }): OutputSavedViewPreview =>
  (params) => {
    const { res, projectId, viewId, type } = params
    const view = await deps.getSavedView({ projectId, viewId })
    if (!view) {
      throw new SavedViewPreviewRetrievalError()
    }
  }
