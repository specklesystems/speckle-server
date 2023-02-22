import {
  InjectableViewerState,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { SelectionEvent, ViewerEvent } from '@speckle/viewer'
import { debounce, throttle } from 'lodash-es'
import { Nullable } from '@speckle/shared'

export function useViewerCameraTracker(
  callback: () => void,
  options?: Partial<{ throttleWait: number }>
): void {
  const {
    viewer: { instance }
  } = useInjectedViewerState()
  const { throttleWait = 50 } = options || {}

  const finalCallback = throttleWait ? throttle(callback, throttleWait) : callback

  onMounted(() => {
    instance.cameraHandler.controls.addEventListener('update', finalCallback)
  })

  onBeforeUnmount(() => {
    instance.cameraHandler.controls.removeEventListener('update', finalCallback)
  })
}

export function useSelectionEvents(
  params: {
    singleClickCallback?: (event: Nullable<SelectionEvent>) => void
    doubleClickCallback?: (event: Nullable<SelectionEvent>) => void
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
