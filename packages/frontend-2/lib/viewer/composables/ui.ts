import { SpeckleViewer, timeoutAt } from '@speckle/shared'
import type { TreeNode } from '@speckle/viewer'
import { CameraController } from '@speckle/viewer'
import type { MeasurementOptions, PropertyInfo } from '@speckle/viewer'
import { until } from '@vueuse/shared'
import { difference, isString, uniq } from 'lodash-es'
import { useEmbedState } from '~/lib/viewer/composables/setup/embed'
import type { SpeckleObject } from '~~/lib/common/helpers/sceneExplorer'
import { isNonNullable } from '~~/lib/common/helpers/utils'
import {
  useInjectedViewer,
  useInjectedViewerInterfaceState,
  useInjectedViewerState
} from '~~/lib/viewer/composables/setup'
import { useDiffBuilderUtilities } from '~~/lib/viewer/composables/setup/diff'
import { useTourStageState } from '~~/lib/viewer/composables/tour'

export function useSectionBoxUtilities() {
  const { instance } = useInjectedViewer()
  const {
    sectionBox,
    filters: { selectedObjects }
  } = useInjectedViewerInterfaceState()

  const isSectionBoxEnabled = computed(() => !!sectionBox.value)
  const toggleSectionBox = () => {
    if (isSectionBoxEnabled.value) {
      sectionBox.value = null
      return
    }

    const objectIds = selectedObjects.value.map((o) => o.id).filter(isNonNullable)
    const box = instance.getSectionBoxFromObjects(objectIds)
    sectionBox.value = box
  }
  const sectionBoxOn = () => {
    if (!isSectionBoxEnabled.value) {
      toggleSectionBox()
    }
  }
  const sectionBoxOff = () => {
    sectionBox.value = null
  }

  return {
    isSectionBoxEnabled,
    toggleSectionBox,
    sectionBoxOn,
    sectionBoxOff,
    sectionBox
  }
}

export function useCameraUtilities() {
  const { instance } = useInjectedViewer()
  const {
    filters: { selectedObjects, isolatedObjectIds },
    camera
  } = useInjectedViewerInterfaceState()

  const zoom = (...args: Parameters<typeof instance.zoom>) => instance.zoom(...args)

  const setView = (...args: Parameters<typeof instance.setView>) => {
    instance.setView(...args)
  }
  const cameraController = instance.getExtension(CameraController)
  const truck = (...args: Parameters<typeof cameraController.controls.truck>) =>
    cameraController.controls.truck(...args)

  const zoomExtentsOrSelection = () => {
    const ids = selectedObjects.value.map((o) => o.id).filter(isNonNullable)

    if (ids.length > 0) {
      return instance.zoom(ids)
    }

    if (isolatedObjectIds.value.length) {
      return instance.zoom(isolatedObjectIds.value)
    }

    instance.zoom()
  }

  const toggleProjection = () => {
    camera.isOrthoProjection.value = !camera.isOrthoProjection.value
  }

  const forceViewToViewerSync = () => {
    setView({
      position: camera.position.value,
      target: camera.target.value
    })
  }

  return {
    zoomExtentsOrSelection,
    toggleProjection,
    camera,
    truck,
    setView,
    zoom,
    forceViewToViewerSync
  }
}

export function useFilterUtilities() {
  // const { instance } = useInjectedViewer()
  const { filters, explodeFactor } = useInjectedViewerInterfaceState()
  const {
    viewer: {
      metadata: { availableFilters }
    }
  } = useInjectedViewerState()

  const isolateObjects = (
    objectIds: string[],
    options?: Partial<{
      replace: boolean
    }>
  ) => {
    filters.isolatedObjectIds.value = uniq([
      ...(options?.replace ? [] : filters.isolatedObjectIds.value),
      ...objectIds
    ])
    // instance.isolateObjects(objectIds, 'utilities', true)
  }

  const unIsolateObjects = (objectIds: string[]) => {
    filters.isolatedObjectIds.value = difference(
      filters.isolatedObjectIds.value,
      objectIds
    )
    // instance.unIsolateObjects(objectIds, 'utilities', true)
  }

  const hideObjects = (
    objectIds: string[],
    options?: Partial<{
      replace: boolean
    }>
  ) => {
    filters.hiddenObjectIds.value = uniq([
      ...(options?.replace ? [] : filters.hiddenObjectIds.value),
      ...objectIds
    ])
    // instance.hideObjects(objectIds, 'utilities', true)
  }

  const showObjects = (objectIds: string[]) => {
    filters.hiddenObjectIds.value = difference(filters.hiddenObjectIds.value, objectIds)
    // instance.showObjects(objectIds, 'utilities', true)
  }

  /**
   * Sets the current filter property. Does not apply it (instruct viewer to color objects).
   */
  const setPropertyFilter = (property: PropertyInfo) => {
    filters.propertyFilter.filter.value = property
  }

  /**
   * Instructs the viewer to apply the current property filter (color objects).
   */
  const applyPropertyFilter = () => {
    filters.propertyFilter.isApplied.value = true
  }

  /**
   * Unsets the current property filter.
   */
  const removePropertyFilter = () => {
    filters.propertyFilter.isApplied.value = false
    filters.propertyFilter.filter.value = null
  }

  /**
   * Unapplies the current property filter - removes object colouring
   */
  const unApplyPropertyFilter = () => {
    filters.propertyFilter.isApplied.value = false
  }

  const resetFilters = () => {
    filters.hiddenObjectIds.value = []
    filters.isolatedObjectIds.value = []
    filters.propertyFilter.filter.value = null
    filters.propertyFilter.isApplied.value = false
    explodeFactor.value = 0
    // filters.selectedObjects.value = []
  }

  const waitForAvailableFilter = async (
    key: string,
    options?: Partial<{ timeout: number }>
  ) => {
    const timeout = options?.timeout || 10000

    const res = await Promise.race([
      until(availableFilters).toMatch(
        (filters) => !!filters?.find((p) => p.key === key)
      ),
      timeoutAt(timeout, 'Waiting for available filter timed out')
    ])

    const filter = res?.find((p) => p.key === key)
    return filter as NonNullable<typeof filter>
  }

  return {
    isolateObjects,
    unIsolateObjects,
    hideObjects,
    showObjects,
    filters,
    setPropertyFilter,
    applyPropertyFilter,
    removePropertyFilter,
    unApplyPropertyFilter,
    resetFilters,
    waitForAvailableFilter
  }
}

export function useSelectionUtilities() {
  const {
    filters: { selectedObjects }
  } = useInjectedViewerInterfaceState()
  const {
    metadata: { worldTree }
  } = useInjectedViewer()

  const setSelectionFromObjectIds = (objectIds: string[]) => {
    const objs: Array<SpeckleObject> = []
    objectIds.forEach((value: string) => {
      objs.push(
        ...((worldTree.value?.findId(value) || []) as unknown as TreeNode[]).map(
          (node: TreeNode) =>
            (node.model as Record<string, unknown>).raw as SpeckleObject
        )
      )
    })
    selectedObjects.value = objs
  }

  const addToSelection = (object: SpeckleObject) => {
    const idx = selectedObjects.value.findIndex((o) => o.id === object.id)
    if (idx !== -1) return

    selectedObjects.value = [...selectedObjects.value, object]
  }

  const removeFromSelection = (objectOrId: SpeckleObject | string) => {
    const oid = isString(objectOrId) ? objectOrId : objectOrId.id
    const idx = selectedObjects.value.findIndex((o) => o.id === oid)
    if (idx === -1) return

    const newObjects = selectedObjects.value.slice()
    newObjects.splice(idx, 1)
    selectedObjects.value = newObjects
  }

  const clearSelection = () => {
    selectedObjects.value = []
  }

  return {
    addToSelection,
    removeFromSelection,
    clearSelection,
    setSelectionFromObjectIds,
    objects: selectedObjects
  }
}

export function useDiffUtilities() {
  const state = useInjectedViewerState()
  const { serializeDiffCommand, deserializeDiffCommand, areDiffsEqual } =
    useDiffBuilderUtilities()

  const endDiff = async () => {
    await state.urlHashState.diff.update(null)
  }

  const diffModelVersions = async (
    modelId: string,
    versionA: string,
    versionB: string
  ) => {
    await state.urlHashState.diff.update({
      diffs: [
        {
          versionA: new SpeckleViewer.ViewerRoute.ViewerVersionResource(
            modelId,
            versionA
          ),
          versionB: new SpeckleViewer.ViewerRoute.ViewerVersionResource(
            modelId,
            versionB
          )
        }
      ]
    })
  }

  return {
    serializeDiffCommand,
    deserializeDiffCommand,
    endDiff,
    diffModelVersions,
    areDiffsEqual
  }
}

export function useThreadUtilities() {
  const {
    urlHashState: { focusedThreadId },
    ui: {
      threads: {
        openThread: { thread: openThread }
      }
    }
  } = useInjectedViewerState()

  const isOpenThread = (id: string) => focusedThreadId.value === id

  const closeAllThreads = async () => {
    await focusedThreadId.update(null)
  }

  const open = async (id: string) => {
    if (id === focusedThreadId.value) return
    await focusedThreadId.update(id)
    await Promise.all([
      until(focusedThreadId).toBe(id),
      until(openThread).toMatch((t) => t?.id === id)
    ])
  }

  return { closeAllThreads, open, isOpenThread }
}

export function useMeasurementUtilities() {
  const state = useInjectedViewerState()

  const enableMeasurements = (enabled: boolean) => {
    state.ui.measurement.enabled.value = enabled
  }

  const setMeasurementOptions = (options: MeasurementOptions) => {
    state.ui.measurement.options.value = options
  }

  const removeMeasurement = () => {
    if (state.viewer.instance?.removeMeasurement) {
      state.viewer.instance.removeMeasurement()
    }
  }

  return {
    enableMeasurements,
    setMeasurementOptions,
    removeMeasurement
  }
}

/**
 * Some conditional rendering values depend on multiple & overlapping states. This utility reconciles that.
 */
export function useConditionalViewerRendering() {
  const tourState = useTourStageState()
  const embedMode = useEmbedState()

  const showControls = computed(() => {
    if (tourState.value.showTour && !tourState.value.showViewerControls) return false
    if (
      embedMode.embedOptions.value?.isEnabled &&
      embedMode.embedOptions.value.hideControls
    ) {
      return false
    }

    return true
  })

  const showNavbar = computed(() => {
    if (!showControls.value) return false
    if (tourState.value.showTour && !tourState.value.showNavbar) return false
    if (embedMode.embedOptions.value?.isEnabled) return false
    return true
  })

  return {
    showNavbar,
    showControls
  }
}
