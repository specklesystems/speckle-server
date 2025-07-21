import { SpeckleViewer, TIME_MS, timeoutAt } from '@speckle/shared'
import {
  type MeasurementOptions,
  type PropertyInfo,
  ViewMode,
  MeasurementsExtension,
  ViewModes,
  CameraController,
  SelectionExtension,
  ViewerEvent,
  type InlineView,
  type CanonicalView,
  type SpeckleView
} from '@speckle/viewer'
import type { Box3 } from 'three'
import { until } from '@vueuse/shared'
import { difference, uniq } from 'lodash-es'
import { useEmbedState, useEmbed } from '~/lib/viewer/composables/setup/embed'
import type { SpeckleObject } from '~/lib/viewer/helpers/sceneExplorer'
import { isNonNullable } from '~~/lib/common/helpers/utils'
import {
  useInjectedViewer,
  useInjectedViewerInterfaceState,
  useInjectedViewerState,
  type InjectableViewerState
} from '~~/lib/viewer/composables/setup'
import { useDiffBuilderUtilities } from '~~/lib/viewer/composables/setup/diff'
import { getKeyboardShortcutTitle, onKeyboardShortcut } from '@speckle/ui-components'
import { ViewerShortcuts } from '~/lib/viewer/helpers/shortcuts/shortcuts'
import type {
  ViewerShortcut,
  ViewerShortcutAction
} from '~/lib/viewer/helpers/shortcuts/types'
import { useActiveElement } from '@vueuse/core'
import { useTheme } from '~/lib/core/composables/theme'
import { useMixpanel } from '~/lib/core/composables/mp'

export function useSectionBoxUtilities() {
  const { instance } = useInjectedViewer()
  const {
    sectionBox,
    sectionBoxContext: { visible, edited },
    threads: {
      openThread: { thread }
    }
  } = useInjectedViewerInterfaceState()

  const { objectIds: selectedIds } = useSelectionUtilities()

  const isSectionBoxEnabled = computed(() => !!sectionBox.value)
  const isSectionBoxVisible = computed(() => visible.value)
  const isSectionBoxEdited = computed(() => edited.value)

  const resolveSectionBoxFromSelection = () => {
    const objectIds = selectedIds.value.filter(isNonNullable)
    const box = instance.getRenderer().boxFromObjects(objectIds)
    /** When generating a section box from selection we don't apply any rotation */
    sectionBox.value = {
      min: box.min.toArray(),
      max: box.max.toArray()
    }
  }

  const toggleSectionBox = () => {
    if (!isSectionBoxEnabled.value) {
      resolveSectionBoxFromSelection()
      return
    }

    if (isSectionBoxVisible.value) {
      visible.value = false
    } else {
      visible.value = true
    }
  }

  const resetSectionBox = () => {
    const serializedSectionBox = thread.value?.viewerState?.ui.sectionBox
    sectionBox.value = null

    if (serializedSectionBox) {
      // Same logic we have in deserialization
      sectionBox.value = {
        min: serializedSectionBox.min,
        max: serializedSectionBox.max,
        rotation: serializedSectionBox.rotation
      }
    }
  }

  return {
    isSectionBoxEnabled,
    isSectionBoxVisible,
    isSectionBoxEdited,
    toggleSectionBox,
    resetSectionBox,
    sectionBox
  }
}

export function useCameraUtilities() {
  type ViewArg = string[] | CanonicalView | SpeckleView | InlineView | Box3 | undefined

  const { instance } = useInjectedViewer()
  const {
    filters: { isolatedObjectIds },
    camera
  } = useInjectedViewerInterfaceState()

  const { objectIds: selectedIds } = useSelectionUtilities()

  const cam = instance.getExtension(CameraController)

  const setView = (view: ViewArg, transition = true, fit = 1.2) => {
    cam.setCameraView(view as Parameters<typeof cam.setCameraView>[0], transition, fit)
  }

  const zoom = (objectIds?: string[], fit = 1.2, transition = true) => {
    cam.setCameraView(objectIds, transition, fit)
  }

  const zoomExtentsOrSelection = () => {
    const ids = selectedIds.value

    if (ids.length > 0) {
      return zoom(ids)
    }

    if (isolatedObjectIds.value.length) {
      return zoom(isolatedObjectIds.value)
    }

    zoom()
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
    setView,
    zoom,
    forceViewToViewerSync
  }
}

export function useFilterUtilities(
  options?: Partial<{ state: InjectableViewerState }>
) {
  const state = options?.state || useInjectedViewerState()
  const {
    viewer,
    ui: { filters, explodeFactor }
  } = state

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
  }

  const waitForAvailableFilter = async (
    key: string,
    options?: Partial<{ timeout: number }>
  ) => {
    const timeout = options?.timeout || 10 * TIME_MS.second

    const res = await Promise.race([
      until(viewer.metadata.availableFilters).toMatch(
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
  const { instance } = useInjectedViewer()
  const selExt = instance.getExtension(SelectionExtension)

  const objects = shallowRef<SpeckleObject[]>(
    selExt.getSelectedObjects() as SpeckleObject[]
  )
  const objectIds = computed(() => objects.value.map((o) => o.id as string))

  // keep in sync with viewer events
  const sync = () => {
    objects.value = selExt.getSelectedObjects() as SpeckleObject[]
  }
  instance.on(ViewerEvent.ObjectClicked, sync)
  instance.on(ViewerEvent.ObjectDoubleClicked, sync)

  const clearSelection = () => selExt.clearSelection()
  const setSelectionFromObjectIds = (ids: string[]) => selExt.selectObjects(ids, false)
  const addToSelectionFromObjectIds = (ids: string[]) => selExt.selectObjects(ids, true)
  const removeFromSelectionObjectIds = (ids: string[]) => selExt.unselectObjects(ids)
  const addToSelection = (o: SpeckleObject) => selExt.selectObjects([o.id], true)
  const removeFromSelection = (o: SpeckleObject | string) =>
    selExt.unselectObjects([typeof o === 'string' ? o : o.id])

  return {
    addToSelection,
    removeFromSelection,
    clearSelection,
    setSelectionFromObjectIds,
    addToSelectionFromObjectIds,
    removeFromSelectionObjectIds,
    objects,
    objectIds
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
      until(focusedThreadId).toMatch((tid) => tid === id),
      until(openThread).toMatch((t) => t?.id === id)
    ])
  }

  return { closeAllThreads, open, isOpenThread }
}

export function useMeasurementUtilities() {
  const state = useInjectedViewerState()

  const measurementOptions = computed(() => state.ui.measurement.options.value)

  const enableMeasurements = (enabled: boolean) => {
    state.ui.measurement.enabled.value = enabled
  }

  const setMeasurementOptions = (options: MeasurementOptions) => {
    state.ui.measurement.options.value = options
  }

  const removeMeasurement = () => {
    const measExt = state.viewer.instance.getExtension(MeasurementsExtension)
    if (measExt?.removeMeasurement) measExt.removeMeasurement()
  }

  const clearMeasurements = () => {
    state.viewer.instance.getExtension(MeasurementsExtension).clearMeasurements()
  }

  const getActiveMeasurement = () => {
    const measurementsExtension =
      state.viewer.instance.getExtension(MeasurementsExtension)
    const activeMeasurement = measurementsExtension?.activeMeasurement
    return activeMeasurement && activeMeasurement.state === 2
  }

  return {
    measurementOptions,
    enableMeasurements,
    setMeasurementOptions,
    removeMeasurement,
    clearMeasurements,
    getActiveMeasurement
  }
}

/**
 * Some conditional rendering values depend on multiple & overlapping states. This utility reconciles that.
 */
export function useConditionalViewerRendering() {
  const embedMode = useEmbedState()

  const showControls = computed(() => {
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
    if (embedMode.embedOptions.value?.isEnabled) return false
    return true
  })

  return {
    showNavbar,
    showControls
  }
}

export function useHighlightedObjectsUtilities() {
  const {
    ui: { highlightedObjectIds }
  } = useInjectedViewerState()

  const highlightObjects = (ids: string[]) => {
    highlightedObjectIds.value = [...new Set([...highlightedObjectIds.value, ...ids])]
  }

  const unhighlightObjects = (ids: string[]) => {
    highlightedObjectIds.value = highlightedObjectIds.value.filter(
      (id) => !ids.includes(id)
    )
  }

  const clearHighlightedObjects = () => {
    highlightedObjectIds.value = []
  }

  return {
    highlightObjects,
    unhighlightObjects,
    clearHighlightedObjects
  }
}

export function useViewModeUtilities() {
  const { instance } = useInjectedViewer()
  const { viewMode } = useInjectedViewerInterfaceState()
  const { isLightTheme } = useTheme()
  const mp = useMixpanel()

  const edgesEnabled = ref(true)
  const edgesWeight = ref(1)
  const outlineOpacity = ref(0.75)
  const defaultColor = ref(0x1a1a1a)
  const edgesColor = ref(defaultColor.value)

  const currentViewMode = computed(() => viewMode.value)

  const updateViewMode = () => {
    const viewModes = instance.getExtension(ViewModes)
    if (viewModes) {
      viewModes.setViewMode(currentViewMode.value, {
        edges: edgesEnabled.value,
        outlineThickness: edgesWeight.value,
        outlineOpacity: outlineOpacity.value,
        outlineColor: edgesColor.value
      })
    }
  }

  const setViewMode = (mode: ViewMode) => {
    viewMode.value = mode
    if (mode === ViewMode.PEN) {
      outlineOpacity.value = 1
      edgesEnabled.value = true
      if (edgesColor.value === defaultColor.value) {
        if (!isLightTheme.value) {
          edgesColor.value = 0xffffff
        }
      }
    } else {
      outlineOpacity.value = 0.75
      if (edgesColor.value === 0xffffff) {
        edgesColor.value = isLightTheme.value ? 0xffffff : defaultColor.value
      }
    }

    updateViewMode()
    mp.track('Viewer Action', {
      type: 'action',
      name: 'set-view-mode',
      mode
    })
  }

  const toggleEdgesEnabled = () => {
    edgesEnabled.value = !edgesEnabled.value
    updateViewMode()
    mp.track('Viewer Action', {
      type: 'action',
      name: 'toggle-edges',
      enabled: edgesEnabled.value
    })
  }

  const setEdgesWeight = (weight: number) => {
    edgesWeight.value = Number(weight)
    updateViewMode()
    mp.track('Viewer Action', {
      type: 'action',
      name: 'set-edges-weight',
      weight: edgesWeight.value
    })
  }

  const setEdgesColor = (color: number) => {
    edgesColor.value = color
    updateViewMode()
    mp.track('Viewer Action', {
      type: 'action',
      name: 'set-edges-color',
      color: color.toString(16).padStart(6, '0')
    })
  }

  onBeforeUnmount(() => {
    // Reset edges settings
    edgesEnabled.value = true
    edgesWeight.value = 1
    outlineOpacity.value = 0.75
    edgesColor.value = defaultColor.value

    // Reset view mode to default
    viewMode.value = ViewMode.DEFAULT
    updateViewMode()
  })

  return {
    currentViewMode,
    setViewMode,
    edgesEnabled,
    toggleEdgesEnabled,
    edgesWeight,
    setEdgesWeight,
    setEdgesColor,
    edgesColor
  }
}

export function useViewerShortcuts() {
  const { ui } = useInjectedViewerState()
  const { isSmallerOrEqualSm } = useIsSmallerOrEqualThanBreakpoint()
  const { isEnabled: isEmbedEnabled } = useEmbed()
  const activeElement = useActiveElement()

  const isTypingComment = computed(() => {
    if (
      activeElement.value &&
      (activeElement.value.tagName.toLowerCase() === 'input' ||
        activeElement.value.tagName.toLowerCase() === 'textarea' ||
        activeElement.value.getAttribute('contenteditable') === 'true')
    ) {
      return true
    }

    // Check thread editor states
    const isNewThreadEditorOpen = ui.threads.openThread.newThreadEditor.value
    const isExistingThreadEditorOpen = !!ui.threads.openThread.thread.value

    return isNewThreadEditorOpen || isExistingThreadEditorOpen
  })

  const formatKey = (key: string) => {
    if (key.startsWith('Digit')) {
      return key.slice(5)
    }
    return key
  }

  const getShortcutDisplayText = (
    shortcut: ViewerShortcut,
    options?: { hideName?: boolean }
  ) => {
    if (isSmallerOrEqualSm.value) return undefined
    if (isEmbedEnabled.value) return undefined

    const shortcutText = getKeyboardShortcutTitle([
      ...shortcut.modifiers,
      formatKey(shortcut.key)
    ])

    if (!options?.hideName) {
      return `${shortcut.name} (${shortcutText})`
    }

    return shortcutText
  }

  const disableShortcuts = computed(() => isTypingComment.value || isEmbedEnabled.value)

  const registerShortcuts = (
    handlers: Partial<Record<ViewerShortcutAction, () => void>>
  ) => {
    Object.values(ViewerShortcuts).forEach((shortcut) => {
      const handler = handlers[shortcut.action as ViewerShortcutAction]
      if (handler) {
        onKeyboardShortcut([...shortcut.modifiers], shortcut.key, () => {
          if (!disableShortcuts.value) handler()
        })
      }
    })
  }

  return {
    shortcuts: ViewerShortcuts,
    registerShortcuts,
    getShortcutDisplayText
  }
}
