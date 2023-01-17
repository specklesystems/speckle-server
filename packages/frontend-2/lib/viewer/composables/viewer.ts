import {
  InjectableViewerState,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { SelectionEvent, ViewerEvent } from '@speckle/viewer'

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
    singleClickCallback?: (args: SelectionEvent) => void
    doubleClickCallback?: (args: SelectionEvent) => void
  },
  options?: Partial<{
    state: InjectableViewerState
  }>
) {
  if (process.server) return
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
