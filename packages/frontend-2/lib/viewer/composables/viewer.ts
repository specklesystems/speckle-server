/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  InitialStateWithRequestAndResponse,
  InjectableViewerState,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { SelectionEvent, ViewerEvent } from '@speckle/viewer'
import { debounce, isArray, throttle } from 'lodash-es'
import { MaybeAsync, Nullable } from '@speckle/shared'
import { ViewerResourceItem } from '~~/lib/common/generated/gql/graphql'
import { until } from '@vueuse/core'
import { SpeckleViewer } from '@speckle/shared'
import { VisualDiffMode } from '@speckle/viewer'

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

let preDiffResources = [] as SpeckleViewer.ViewerRoute.ViewerResource[]
export function useDiffing() {
  const state = useInjectedViewerState()
  const getObjectUrl = useGetObjectUrl()

  const diff = async (modelId: string, versionA: string, versionB: string) => {
    preDiffResources = [...state.resources.request.items.value]

    state.resources.request.addModelVersion(modelId, versionB)
    state.resources.request.addModelVersion(modelId, versionA)

    await until(state.ui.viewerBusy).toBe(true) // wait for autoloading to kick in
    await until(state.ui.viewerBusy).toBe(false) // wait for it to finish

    const A = state.resources.response.resourceItems.value.find(
      (r) => r.versionId === versionA
    )
    const B = state.resources.response.resourceItems.value.find(
      (r) => r.versionId === versionB
    )

    if (!A || !B) throw new Error('Version not loaded')
    setTimeout(async () => {
      state.ui.diff.diffResult.value = await state.viewer.instance.diff(
        getObjectUrl(state.projectId.value, B?.objectId as string),
        getObjectUrl(state.projectId.value, A?.objectId as string),
        state.ui.diff.diffMode.value
      )
      state.ui.diff.diffTime.value = 0.5
      state.ui.diff.diffMode.value = VisualDiffMode.COLORED
      state.viewer.instance.setDiffTime(state.ui.diff.diffResult.value, 0.5)
    }, 1000)

    state.urlHashState.compare.value = true // could be one place
    state.ui.diff.enabled.value = true
  }

  watch(state.ui.diff.diffMode, (val) => {
    if (!state.ui.diff.diffResult.value) return
    state.viewer.instance.setVisualDiffMode(state.ui.diff.diffResult.value, val)
    state.viewer.instance.setDiffTime(
      state.ui.diff.diffResult.value,
      state.ui.diff.diffTime.value
    ) // hmm, why do i need to call diff time again?
  })

  watch(state.ui.diff.diffTime, (val) => {
    if (!state.ui.diff.diffResult.value) return
    state.viewer.instance.setDiffTime(state.ui.diff.diffResult.value, val)
  })

  const endDiff = () => {
    state.ui.diff.enabled.value = false
    state.viewer.instance.undiff()
    state.resources.request.setModelVersions(preDiffResources)
    // Hack, for some reason they conflict :/
    setTimeout(() => {
      state.urlHashState.compare.value = null
    }, 100)
  }

  return {
    diff,
    endDiff
  }
}
