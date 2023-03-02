import {
  InitialStateWithRequestAndResponse,
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

export function useViewerCameraRestTracker(
  callback: () => void,
  options?: Partial<{ debounceWait: number }>
): void {
  const {
    viewer: { instance }
  } = useInjectedViewerState()

  const { debounceWait = 200 } = options || {}

  const finalCallback = debounceWait ? debounce(callback, debounceWait) : callback

  onMounted(() => {
    instance.cameraHandler.controls.addEventListener('rest', finalCallback)
  })

  onBeforeUnmount(() => {
    instance.cameraHandler.controls.removeEventListener('rest', finalCallback)
  })
}

export function useSelectionEvents(
  params: {
    singleClickCallback?: (event: Nullable<SelectionEvent>) => void
    doubleClickCallback?: (event: Nullable<SelectionEvent>) => void
  },
  options?: Partial<{
    state: InitialStateWithRequestAndResponse
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

export function useGetObjectUrl() {
  const config = useRuntimeConfig()
  return (projectId: string, objectId: string) =>
    `${config.public.apiOrigin}/streams/${projectId}/objects/${objectId}`
}
