import { useInjectedPresentationState } from '~/lib/presentations/composables/setup'
import { useDebugPresentationStateIntegration } from '~/lib/presentations/composables/setup/dev'
import { useViewerUserActivityTracking } from '~/lib/viewer/composables/activity'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'

const useActivityTrackingIntegration = () => {
  useViewerUserActivityTracking({
    trackInternallyOnly: true
  })
}

const useResetTrackingIntegration = () => {
  const { on } = useEventBus()
  const {
    ui: { slideIdx },
    viewer: { hasViewChanged }
  } = useInjectedPresentationState()
  const {
    ui: {
      savedViews: { savedViewStateId }
    }
  } = useInjectedViewerState()

  on(ViewerEventBusKeys.UserChangedOpenedView, () => {
    hasViewChanged.value = true
  })

  watch(
    slideIdx,
    () => {
      savedViewStateId.value = undefined
      hasViewChanged.value = false
    },
    { flush: 'sync' }
  )
}

/**
 * Post setup work to run after the viewer (and presentation) states have been set up
 */
export const usePresentationViewerPostSetup = () => {
  if (import.meta.server) return
  useActivityTrackingIntegration()
  useResetTrackingIntegration()
  useDebugPresentationStateIntegration()
}
