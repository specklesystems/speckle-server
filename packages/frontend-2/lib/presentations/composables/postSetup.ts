import { useViewerUserActivityTracking } from '~/lib/viewer/composables/activity'

const useActivityTrackingIntegration = () => {
  useViewerUserActivityTracking({
    trackInternallyOnly: true
  })
}

export const usePresentationViewerPostSetup = () => {
  if (import.meta.server) return
  useActivityTrackingIntegration()
}
