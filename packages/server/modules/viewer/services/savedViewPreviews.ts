import type {
  GetSavedView,
  OutputSavedViewPreview
} from '@/modules/viewer/domain/operations/savedViews'

export const outputSavedViewPreviewFactory =
  (deps: { getSavedView: GetSavedView }): OutputSavedViewPreview =>
  () => {
    // TODO:
  }
