import {
  InjectableViewerState,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { SelectionEvent, ViewerEvent } from '@speckle/viewer'
import { debounce } from 'lodash-es'

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
    singleClickCallback?: (event: SelectionEvent) => void
    doubleClickCallback?: (event: SelectionEvent) => void
  },
  options?: Partial<{
    state: InjectableViewerState
    debounceWait: number
  }>
) {
  if (process.server) return
  const { singleClickCallback, doubleClickCallback } = params
  const {
    viewer: { instance }
  } = options?.state || useInjectedViewerState()
  const { debounceWait = 50 } = options || {}

  const debouncedSingleClickCallback = singleClickCallback
    ? debounce(singleClickCallback, debounceWait)
    : undefined
  const debouncedDoubleClickCallback = doubleClickCallback
    ? debounce(doubleClickCallback, debounceWait)
    : undefined

  onMounted(() => {
    if (debouncedDoubleClickCallback) {
      instance.on(ViewerEvent.ObjectDoubleClicked, debouncedDoubleClickCallback)
    }
    if (debouncedSingleClickCallback) {
      instance.on(ViewerEvent.ObjectClicked, debouncedSingleClickCallback)
    }
  })

  onBeforeUnmount(() => {
    if (debouncedDoubleClickCallback) {
      instance.removeListener(
        ViewerEvent.ObjectDoubleClicked,
        debouncedDoubleClickCallback
      )
    }
    if (debouncedSingleClickCallback) {
      instance.removeListener(ViewerEvent.ObjectClicked, debouncedSingleClickCallback)
    }
  })
}
