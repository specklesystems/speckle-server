/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  InitialStateWithRequestAndResponse,
  InjectableViewerState,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { SelectionEvent, ViewerEvent } from '@speckle/viewer'
import { debounce, isArray, throttle, isFunction } from 'lodash-es'
import { MaybeAsync, Nullable, Optional } from '@speckle/shared'
import { Merge } from 'type-fest'
import { WatchSource } from 'vue'

function getFirstVisibleSelectionHit(
  { hits }: SelectionEvent,
  state: Pick<InjectableViewerState, 'viewer'>
) {
  const {
    viewer: {
      metadata: { filteringState }
    }
  } = state

  const hasHiddenObjects = (filteringState.value?.hiddenObjects || []).length !== 0
  const hasIsolatedObjects =
    !!filteringState.value?.isolatedObjects &&
    filteringState.value?.isolatedObjects.length !== 0

  for (const hit of hits) {
    if (hasHiddenObjects) {
      if (!filteringState.value?.hiddenObjects?.includes(hit.object.id as string)) {
        return hit
      }
    } else if (hasIsolatedObjects) {
      if (filteringState.value.isolatedObjects?.includes(hit.object.id as string))
        return hit
    } else {
      return hit
    }
  }
  return null
}

export function useViewerEventListener<A = any>(
  name: ViewerEvent | ViewerEvent[],
  listener: (...args: A[]) => MaybeAsync<void>,
  options?: Partial<{
    state: InitialStateWithRequestAndResponse
  }>
) {
  const {
    viewer: { instance }
  } = options?.state || useInjectedViewerState()
  const names = isArray(name) ? name : [name]

  const unmount = () => {
    for (const n of names) {
      instance.removeListener(n, listener)
    }
  }

  onMounted(() => {
    for (const n of names) {
      instance.on(n, listener)
    }
  })

  onBeforeUnmount(() => {
    unmount
  })

  return unmount
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
    singleClickCallback?: (
      event: Nullable<SelectionEvent>,
      extra: { firstVisibleSelectionHit: Nullable<SelectionEvent['hits'][0]> }
    ) => void
    doubleClickCallback?: (
      event: Nullable<SelectionEvent>,
      extra: { firstVisibleSelectionHit: Nullable<SelectionEvent['hits'][0]> }
    ) => void
  },
  options?: Partial<{
    state: InitialStateWithRequestAndResponse
    debounceWait: number
  }>
) {
  if (process.server) return
  const { singleClickCallback, doubleClickCallback } = params
  const state = options?.state || useInjectedViewerState()
  const {
    viewer: { instance }
  } = state
  const { debounceWait = 50 } = options || {}

  const debouncedSingleClickCallback = singleClickCallback
    ? debounce((event: Nullable<SelectionEvent>) => {
        const firstVisibleSelectionHit = event
          ? getFirstVisibleSelectionHit(event, state)
          : null
        return singleClickCallback(event, { firstVisibleSelectionHit })
      }, debounceWait)
    : undefined
  const debouncedDoubleClickCallback = doubleClickCallback
    ? debounce((event: Nullable<SelectionEvent>) => {
        const firstVisibleSelectionHit = event
          ? getFirstVisibleSelectionHit(event, state)
          : null
        return doubleClickCallback(event, { firstVisibleSelectionHit })
      }, debounceWait)
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

export function useOnViewerLoadComplete(
  listener: (params: { isInitial: boolean }) => MaybeAsync<void>,
  options?: Partial<{
    initialOnly: boolean
  }>
) {
  const { initialOnly } = options || {}

  const hasRun = ref(false)

  const cancel = useViewerEventListener(ViewerEvent.LoadComplete, () => {
    if (!initialOnly || !hasRun.value) {
      listener({ isInitial: !hasRun.value })
    }

    hasRun.value = true
    if (initialOnly) cancel()
  })
}
