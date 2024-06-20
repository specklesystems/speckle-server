import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import type {
  InitialStateWithRequestAndResponse,
  InjectableViewerState
} from '~~/lib/viewer/composables/setup'
import { CameraEvent, ViewerEvent } from '@speckle/viewer'
import { debounce, isArray, throttle } from 'lodash-es'
import { until } from '@vueuse/core'
import { TimeoutError, timeoutAt } from '@speckle/shared'
import type { MaybeAsync, Nullable } from '@speckle/shared'
import { Vector3 } from 'three'
import { areVectorsLooselyEqual } from '~~/lib/viewer/helpers/three'
import {
  CameraController,
  type ViewerEventPayload,
  type SelectionEvent,
  type TreeNode
} from '@speckle/viewer'
import type { SpeckleObject } from '~/lib/viewer/helpers/sceneExplorer'

// NOTE: this is a preformance optimisation - this function is hot, and has to do
// potentially large searches if many elements are hidden/isolated. We cache the
// result for 250ms, which represents a single click.
// NOTE: in the near future, this will hopefully not be needed as we'll have
// viewer bound modules to help us with selection and visibility state management.
const cacheTimeoutMs = 250
let hitCache: Nullable<{
  node: TreeNode
  point: Vector3
}> = null
let lastCacheRefresh: number = Date.now()

function getFirstVisibleSelectionHit(
  { hits }: SelectionEvent,
  state: Pick<InjectableViewerState, 'viewer'>
) {
  const {
    viewer: {
      metadata: { filteringState }
    }
  } = state

  if (Date.now() - lastCacheRefresh < cacheTimeoutMs && hitCache) {
    return hitCache
  }
  hitCache = null
  lastCacheRefresh = Date.now()

  const hasHiddenObjects = (filteringState.value?.hiddenObjects || []).length !== 0
  const hasIsolatedObjects =
    !!filteringState.value?.isolatedObjects &&
    filteringState.value?.isolatedObjects.length !== 0

  for (const hit of hits) {
    if (hasHiddenObjects) {
      if (
        !filteringState.value?.hiddenObjects?.includes(
          ((hit.node.model as Record<string, unknown>).raw as SpeckleObject)
            .id as string
        )
      ) {
        hitCache = hit
        return hitCache
      }
    } else if (hasIsolatedObjects) {
      if (
        filteringState.value.isolatedObjects?.includes(
          ((hit.node.model as Record<string, unknown>).raw as SpeckleObject)
            .id as string
        )
      ) {
        hitCache = hit
        return hitCache
      }
    } else {
      hitCache = hit
      return hitCache
    }
  }
  return null
}

export function useViewerEventListener<K extends ViewerEvent>(
  name: K | K[],
  listener: (args: ViewerEventPayload[K]) => MaybeAsync<void>,
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
    unmount()
  })

  return unmount
}

export function useViewerCameraTracker(
  callback: () => void,
  options?: Partial<{
    throttleWait: number
    debounceWait: number
    onlyInvokeOnMeaningfulChanges: boolean
  }>
): void {
  const {
    viewer: { instance }
  } = useInjectedViewerState()
  const {
    throttleWait = 50,
    debounceWait,
    onlyInvokeOnMeaningfulChanges
  } = options || {}

  const lastPos = ref(null as Nullable<Vector3>)
  const lastTarget = ref(null as Nullable<Vector3>)

  const callbackChangeTrackerWrapper = (changed: boolean) => {
    if (!changed) return

    if (!onlyInvokeOnMeaningfulChanges) {
      return callback()
    }

    // Only invoke callback if position/target changed in a meaningful way
    const extension: CameraController = instance.getExtension(CameraController)
    const viewerPos = new Vector3().copy(extension.renderingCamera.position)
    const viewerTarget = new Vector3().copy(extension.getTarget())

    let meaningfulChangeFound = false
    if (!lastPos.value || !areVectorsLooselyEqual(lastPos.value, viewerPos)) {
      meaningfulChangeFound = true
    }
    if (!lastTarget.value || !areVectorsLooselyEqual(lastTarget.value, viewerTarget)) {
      meaningfulChangeFound = true
    }

    if (meaningfulChangeFound) {
      lastPos.value = viewerPos.clone()
      lastTarget.value = viewerTarget.clone()
      callback()
    }
  }

  const finalCallback = debounceWait
    ? debounce(callbackChangeTrackerWrapper, debounceWait)
    : throttleWait
    ? throttle(callbackChangeTrackerWrapper, throttleWait)
    : callbackChangeTrackerWrapper

  onMounted(() => {
    const extension = instance.getExtension(CameraController)
    extension.on(CameraEvent.LateFrameUpdate, finalCallback)
  })

  onBeforeUnmount(() => {
    instance
      .getExtension(CameraController)
      .removeListener(CameraEvent.LateFrameUpdate, finalCallback)
  })
}

export function useViewerCameraControlStartTracker(callback: () => void) {
  const {
    viewer: { instance }
  } = useInjectedViewerState()
  // Might need different event
  const removeListener = () =>
    instance
      .getExtension(CameraController)
      .removeListener(CameraEvent.InteractionStarted, callback)

  onMounted(() => {
    instance.getExtension(CameraController).on(CameraEvent.InteractionStarted, callback)
  })

  onBeforeUnmount(() => {
    removeListener()
  })

  return removeListener
}

export function useViewerCameraRestTracker(
  callback: () => void,
  options?: Partial<{ debounceWait: number }>
) {
  const {
    viewer: { instance }
  } = useInjectedViewerState()
  // Might need different event
  const { debounceWait = 200 } = options || {}

  const finalCallback = debounceWait ? debounce(callback, debounceWait) : callback
  const removeListener = () => {
    const extension = instance.getExtension(CameraController)

    extension.removeListener(CameraEvent.Stationary, finalCallback)
  }

  onMounted(() => {
    instance.getExtension(CameraController).on(CameraEvent.Stationary, finalCallback)
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
  // Might need different event
  const removeListener = () =>
    instance
      .getExtension(CameraController)
      .removeListener(CameraEvent.Stationary, callback)

  onMounted(() => {
    instance.getExtension(CameraController).on(CameraEvent.Stationary, callback)
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
  if (import.meta.server) return
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
  const apiOrigin = useApiOrigin()
  return (projectId: string, objectId: string) =>
    `${apiOrigin}/streams/${projectId}/objects/${objectId}`
}

export function useOnViewerLoadComplete(
  listener: (params: { isInitial: boolean }) => MaybeAsync<void>,
  options?: Partial<{
    /**
     * Whether to only invoke the listener once on the very first LoadComplete event. Default: false
     */
    initialOnly: boolean
    /**
     * If true, will trigger the listener after the next isBusy=false event that comes after LoadComplete. Default: true
     */
    waitForBusyOver: boolean
  }>
) {
  const {
    ui: { viewerBusy }
  } = useInjectedViewerState()
  const logger = useLogger()
  const { initialOnly, waitForBusyOver = true } = options || {}

  const hasRun = ref(false)

  const cancel = useViewerEventListener(ViewerEvent.LoadComplete, async () => {
    if (initialOnly && hasRun.value) {
      cancel()
      return
    }

    try {
      await (waitForBusyOver
        ? Promise.race([
            until(viewerBusy).toBe(false),
            timeoutAt(
              1000,
              'Waiting for viewer business to be over post-LoadComplete timed out'
            )
          ])
        : Promise.resolve())
    } catch (e) {
      if (!(e instanceof TimeoutError)) throw e
      logger.warn(e.message)
    }

    listener({ isInitial: !hasRun.value })
    hasRun.value = true

    if (initialOnly) cancel()
  })
}
