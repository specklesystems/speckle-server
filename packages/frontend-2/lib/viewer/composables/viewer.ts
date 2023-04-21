/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  InitialStateWithRequestAndResponse,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { SelectionEvent, ViewerEvent } from '@speckle/viewer'
import { debounce, isArray, throttle } from 'lodash-es'
import { MaybeAsync, Nullable } from '@speckle/shared'

export function useViewerEventListener(
  name: ViewerEvent | ViewerEvent[],
  listener: (...args: any[]) => MaybeAsync<void>,
  options?: Partial<{
    state: InitialStateWithRequestAndResponse
  }>
) {
  const {
    viewer: { instance }
  } = options?.state || useInjectedViewerState()
  const names = isArray(name) ? name : [name]

  onMounted(() => {
    for (const n of names) {
      instance.on(n, listener)
    }
  })

  onBeforeUnmount(() => {
    for (const n of names) {
      instance.removeListener(n, listener)
    }
  })
}

export function useViewerCameraTracker(
  callback: () => void,
  options?: Partial<{ throttleWait: number; debounceWait: number }>
): void {
  const {
    viewer: { instance }
  } = useInjectedViewerState()
  const { throttleWait = 50, debounceWait } = options || {}

  const finalCallback = debounceWait
    ? debounce(callback, debounceWait)
    : throttleWait
    ? throttle(callback, throttleWait)
    : callback

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
) {
  const {
    viewer: { instance }
  } = useInjectedViewerState()

  const { debounceWait = 200 } = options || {}

  const finalCallback = debounceWait ? debounce(callback, debounceWait) : callback
  const removeListener = () =>
    instance.cameraHandler.controls.removeEventListener('rest', finalCallback)

  onMounted(() => {
    instance.cameraHandler.controls.addEventListener('rest', finalCallback)
  })

  onBeforeUnmount(() => {
    removeListener()
  })

  return removeListener
}

export function useViewerCameraControlEndTracker(callback: () => void) {
  const {
    viewer: { instance }
  } = useInjectedViewerState()

  const removeListener = () =>
    instance.cameraHandler.controls.removeEventListener('rest', callback)

  onMounted(() => {
    instance.cameraHandler.controls.addEventListener('rest', callback)
  })

  onBeforeUnmount(() => {
    removeListener()
  })

  return removeListener
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
