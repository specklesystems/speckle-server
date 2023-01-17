import {
  InjectableViewerState,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { ViewerEvent } from '@speckle/viewer'

export function useViewerCameraTracker(callback: () => void): void {
  const {
    viewer: { instance }
  } = useInjectedViewerState()

  onMounted(() => {
    instance.cameraHandler.controls.addEventListener('update', callback)
  })

  onBeforeUnmount(() => {
    instance.cameraHandler.controls.removeEventListener('update', callback)
  })
}

export function useSelectionEvents(
  params: {
    singleClickCallback?: () => void
    doubleClickCallback?: () => void
  },
  options?: Partial<{
    state: InjectableViewerState
  }>
) {
  const { singleClickCallback, doubleClickCallback } = params
  const {
    viewer: { instance }
  } = options?.state || useInjectedViewerState()

  onMounted(() => {
    if (doubleClickCallback) {
      instance.on(ViewerEvent.ObjectDoubleClicked, doubleClickCallback)
    }
    if (singleClickCallback) {
      instance.on(ViewerEvent.ObjectClicked, singleClickCallback)
    }
  })

  onBeforeUnmount(() => {
    if (doubleClickCallback) {
      instance.removeListener(ViewerEvent.ObjectDoubleClicked, doubleClickCallback)
    }
    if (singleClickCallback) {
      instance.removeListener(ViewerEvent.ObjectClicked, singleClickCallback)
    }
  })
}
