import { SpeckleViewer, TIME_MS, timeoutAt } from '@speckle/shared'
import {
  type TreeNode,
  type MeasurementOptions,
  type PropertyInfo,
  ViewMode
} from '@speckle/viewer'
import { MeasurementsExtension, ViewModes } from '@speckle/viewer'
import { until } from '@vueuse/shared'
import { difference, isString, uniq } from 'lodash-es'
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
    filters: { selectedObjects },
    threads: {
      openThread: { thread }
    }
  } = useInjectedViewerInterfaceState()

  const isSectionBoxEnabled = computed(() => !!sectionBox.value)
  const isSectionBoxVisible = computed(() => visible.value)
  const isSectionBoxEdited = computed(() => edited.value)

  const resolveSectionBoxFromSelection = () => {
    const objectIds = selectedObjects.value.map((o) => o.id).filter(isNonNullable)
    const box = instance.getRenderer().boxFromObjects(objectIds)
    /** When generating a section box from selection we don't apply any rotation */
    sectionBox.value = {
      min: box.min.toArray(),
      max: box.max.toArray()
    }
  }

  const closeSectionBox = () => {
    visible.value = false
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

  const resetSectionBoxCompletely = () => {
    sectionBox.value = null
    visible.value = false
  }

  return {
    isSectionBoxEnabled,
    isSectionBoxVisible,
    isSectionBoxEdited,
    toggleSectionBox,
    resetSectionBox,
    resetSectionBoxCompletely,
    sectionBox,
    closeSectionBox
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
    // filters.selectedObjects.value = []
  }

  const resetExplode = () => {
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
    resetExplode,
    waitForAvailableFilter
  }
}

export function useSelectionUtilities() {
  const {
    filters: { selectedObjects, selectedObjectIds }
  } = useInjectedViewerInterfaceState()
  const { metadata } = useInjectedViewer()

  const setSelectionFromObjectIds = (objectIds: string[]) => {
    const objs: Array<SpeckleObject> = []
    objectIds.forEach((value: string) => {
      objs.push(
        ...(
          (metadata?.worldTree.value?.findId(value) || []) as unknown as TreeNode[]
        ).map(
          (node: TreeNode) =>
            (node.model as Record<string, unknown>).raw as SpeckleObject
        )
      )
    })
    selectedObjects.value = objs
  }

  const addToSelectionFromObjectIds = (objectIds: string[]) => {
    const originalObjects = selectedObjects.value.slice()
    setSelectionFromObjectIds(objectIds)
    selectedObjects.value = [...originalObjects, ...selectedObjects.value]
  }

  const removeFromSelectionObjectIds = (objectIds: string[]) => {
    const finalObjects = selectedObjects.value.filter(
      (o) => !objectIds.includes(o.id || '')
    )
    selectedObjects.value = finalObjects
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
    addToSelectionFromObjectIds,
    removeFromSelectionObjectIds,
    objects: selectedObjects,
    objectIds: selectedObjectIds
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
    if (state.viewer.instance?.removeMeasurement) {
      state.viewer.instance.removeMeasurement()
    }
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
  const logger = useLogger()

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

  const initializeFromViewerState = () => {
    try {
      const renderer = instance.getRenderer()
      const currentPipeline = renderer?.pipeline

      if (currentPipeline && currentPipeline.options) {
        const currentOptions = currentPipeline.options as Record<string, unknown>

        if (typeof currentOptions.edges === 'boolean') {
          edgesEnabled.value = currentOptions.edges
        }

        const edgesPasses = currentPipeline.getPass('EDGES')

        if (edgesPasses.length > 0) {
          const edgesPass = edgesPasses[0] as unknown as Record<string, unknown>
          const edgesPassOptions = edgesPass._options as Record<string, unknown>

          if (
            edgesPassOptions &&
            typeof edgesPassOptions.outlineThickness === 'number'
          ) {
            edgesWeight.value = edgesPassOptions.outlineThickness
          }
          if (edgesPassOptions && typeof edgesPassOptions.outlineOpacity === 'number') {
            outlineOpacity.value = edgesPassOptions.outlineOpacity
          }
          if (edgesPassOptions && typeof edgesPassOptions.outlineColor === 'number') {
            edgesColor.value = edgesPassOptions.outlineColor
          }
        }
      }
    } catch {
      logger.error('Could not initialize from viewer state, using defaults')
    }
  }

  onMounted(() => {
    initializeFromViewerState()
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
    options?: { hideName?: boolean; format?: 'default' | 'separate' }
  ) => {
    if (isSmallerOrEqualSm.value) return undefined
    if (isEmbedEnabled.value) return undefined

    const shortcutText = getKeyboardShortcutTitle([
      ...shortcut.modifiers,
      formatKey(shortcut.key)
    ])

    if (options?.format === 'separate') {
      const modifiersText =
        shortcut.modifiers.length > 0
          ? getKeyboardShortcutTitle([...shortcut.modifiers])
          : ''
      const keyText = getKeyboardShortcutTitle([formatKey(shortcut.key)])

      return {
        content: `
        <div class="flex flex-row gap-2 m-0 p-0">
          <div class="text-body-2xs text-foreground">${shortcut.name}</div>
          <div class="text-body-3xs text-foreground-3">
            ${
              modifiersText
                ? `<kbd class="p-0.5 min-w-4 text-foreground-2 rounded-md text-body-3xs font-normal font-sans">${modifiersText}</kbd>`
                : ''
            }<kbd class="min-w-3 text-foreground-2 rounded-sm text-body-3xs font-sans">${keyText}</kbd>
          </div>
        </div>
      `,
        allowHTML: true,
        theme: 'speckleTooltip'
      }
    }

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
