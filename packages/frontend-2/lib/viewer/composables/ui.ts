import { SpeckleViewer, TIME_MS, timeoutAt } from '@speckle/shared'
import {
  type TreeNode,
  type MeasurementOptions,
  type PropertyInfo,
  ViewMode
} from '@speckle/viewer'
import {
  MeasurementsExtension,
  ViewModes,
  MeasurementEvent,
  FilteringExtension
} from '@speckle/viewer'
import { until } from '@vueuse/shared'
import { useActiveElement } from '@vueuse/core'
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
import { useTheme } from '~/lib/core/composables/theme'
import { useMixpanel } from '~/lib/core/composables/mp'
import { isStringPropertyInfo } from '~/lib/viewer/helpers/sceneExplorer'
import { FilterCondition } from '~/lib/viewer/helpers/filters/types'
import { useObjectDataStore } from '~~/composables/viewer/useObjectDataStore'
import { useOnViewerLoadComplete } from '~~/lib/viewer/composables/viewer'

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

  // Initialize object data store for advanced filtering
  const dataStore = useObjectDataStore()

  // Populate data store when viewer loads models
  if (import.meta.client) {
    const { instance } = viewer
    const { resourceItems } = state.resources.response

    const populateDataStore = async () => {
      const tree = instance.getWorldTree()
      if (!tree || !resourceItems.value.length) return

      // Check if resources are actually available in the world tree
      const availableResources = resourceItems.value.filter((item) => {
        const nodes = tree.findId(item.objectId)
        return nodes && nodes.length > 0
      })

      if (availableResources.length === 0) return

      // Clear and repopulate the entire data store
      dataStore.clearDataOnRouteLeave()

      const resources = availableResources.map((item) => ({
        resourceUrl: item.objectId
      }))

      await dataStore.populateDataStore(instance, resources)
    }

    // Populate whenever a model finishes loading
    useOnViewerLoadComplete(async () => {
      await populateDataStore()
    })
  }

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
    const filteringExtension = viewer.instance.getExtension(FilteringExtension)
    filteringExtension.isolateObjects(objectIds, 'utilities', true, true)
  }

  const unIsolateObjects = (objectIds: string[]) => {
    filters.isolatedObjectIds.value = difference(
      filters.isolatedObjectIds.value,
      objectIds
    )
    const filteringExtension = viewer.instance.getExtension(FilteringExtension)
    filteringExtension.unIsolateObjects(objectIds, 'utilities', true, true)
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
    const filteringExtension = viewer.instance.getExtension(FilteringExtension)
    filteringExtension.hideObjects(objectIds, 'utilities', false, false)
  }

  const showObjects = (objectIds: string[]) => {
    filters.hiddenObjectIds.value = difference(filters.hiddenObjectIds.value, objectIds)
    const filteringExtension = viewer.instance.getExtension(FilteringExtension)
    filteringExtension.showObjects(objectIds, 'utilities', false)
  }

  /**
   * Gets available values for the current property filter
   */
  const getAvailableFilterValues = (filter: PropertyInfo): string[] => {
    // Type guard to check if filter has valueGroups property
    const hasValueGroups = (
      f: PropertyInfo
    ): f is PropertyInfo & { valueGroups: Array<{ value: unknown }> } => {
      return (
        'valueGroups' in f &&
        Array.isArray((f as unknown as Record<string, unknown>).valueGroups)
      )
    }

    if (hasValueGroups(filter)) {
      return filter.valueGroups
        .map((vg) => String(vg.value))
        .filter(
          (v) => v !== null && v !== undefined && v !== 'null' && v !== 'undefined'
        )
    }

    return []
  }

  /**
   * Adds a new filter or updates existing one
   */
  const addActiveFilter = (filter: PropertyInfo): string => {
    const existingIndex = filters.propertyFilters.value.findIndex(
      (f) => f.filter?.key === filter.key
    )

    if (existingIndex !== -1) {
      // Update existing filter
      return filters.propertyFilters.value[existingIndex].id
    } else {
      // Add new filter
      const id = `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      filters.propertyFilters.value.push({
        filter,
        isApplied: false,
        selectedValues: [],
        id,
        condition: FilterCondition.Is
      })
      return id
    }
  }

  /**
   * Removes an active filter by ID
   */
  const removeActiveFilter = (filterId: string) => {
    const index = filters.propertyFilters.value.findIndex((f) => f.id === filterId)
    if (index !== -1) {
      // If this filter was applying colors, remove the color filter
      if (filters.activeColorFilterId.value === filterId) {
        removeColorFilter()
      }
      filters.propertyFilters.value.splice(index, 1)
    }
  }

  /**
   * Toggles the applied state of a specific filter
   */
  const toggleFilterApplied = (filterId: string) => {
    const filter = filters.propertyFilters.value.find((f) => f.id === filterId)
    if (filter) {
      filter.isApplied = !filter.isApplied
    }
  }

  /**
   * Updates selected values for a specific active filter
   */
  const updateActiveFilterValues = (filterId: string, values: string[]) => {
    const filter = filters.propertyFilters.value.find((f) => f.id === filterId)
    if (filter) {
      filter.selectedValues = [...values]
    }
  }

  /**
   * Updates condition for a specific active filter
   */
  const updateFilterCondition = (filterId: string, condition: FilterCondition) => {
    const filter = filters.propertyFilters.value.find((f) => f.id === filterId)
    if (filter) {
      filter.condition = condition
    }
  }

  /**
   * Toggles a value for a specific active filter
   */
  const toggleActiveFilterValue = (filterId: string, value: string) => {
    const filter = filters.propertyFilters.value.find((f) => f.id === filterId)
    if (filter) {
      const index = filter.selectedValues.indexOf(value)
      if (index > -1) {
        filter.selectedValues.splice(index, 1)
      } else {
        filter.selectedValues.push(value)
      }
    }
  }

  /**
   * Checks if a value is selected for a specific active filter
   */
  const isActiveFilterValueSelected = (filterId: string, value: string): boolean => {
    const filter = filters.propertyFilters.value.find((f) => f.id === filterId)
    return filter ? filter.selectedValues.includes(value) : false
  }

  /**
   * Gets all currently applied filters
   */
  const getAppliedFilters = () => {
    return filters.propertyFilters.value.filter((f) => f.isApplied)
  }

  const resetFilters = () => {
    // Clear all filter state
    filters.hiddenObjectIds.value = []
    filters.isolatedObjectIds.value = []
    filters.propertyFilters.value = []
    filters.selectedObjects.value = []
    filters.activeColorFilterId.value = null

    // Clear all viewer filters including colors
    const filteringExtension = viewer.instance.getExtension(FilteringExtension)
    filteringExtension.resetFilters()
    filteringExtension.removeColorFilter()
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

  // Regex patterns for identifying Revit properties
  const revitPropertyRegex = /^parameters\./
  // Note: we've split this regex check in two to not clash with navis properties. This makes generally makes dim very sad, as we're layering hacks.
  // Navis object properties come under `properties`, same as revit ones - as such we can't assume they're the same. Here we're targeting revit's
  // specific two subcategories of `properties`.
  const revitPropertyRegexDui3000InstanceProps = /^properties\.Instance/ // note this is partially valid for civil3d, or dim should test against it
  const revitPropertyRegexDui3000TypeProps = /^properties\.Type/ // note this is partially valid for civil3d, or dim should test against it

  /**
   * Determines if a property key represents a Revit property
   */
  const isRevitProperty = (key: string): boolean => {
    return (
      revitPropertyRegex.test(key) ||
      revitPropertyRegexDui3000InstanceProps.test(key) ||
      revitPropertyRegexDui3000TypeProps.test(key)
    )
  }

  /**
   * Determines if a property should be excluded from filtering based on its key
   */
  const shouldExcludeFromFiltering = (key: string): boolean => {
    if (
      key.endsWith('.units') ||
      key.endsWith('.speckle_type') ||
      key.includes('.parameters.') ||
      // key.includes('level.') ||
      key.includes('renderMaterial') ||
      key.includes('.domain') ||
      key.includes('plane.') ||
      key.includes('baseLine') ||
      key.includes('referenceLine') ||
      key.includes('end.') ||
      key.includes('start.') ||
      key.includes('endPoint.') ||
      key.includes('midPoint.') ||
      key.includes('startPoint.') ||
      key.includes('.materialName') ||
      key.includes('.materialClass') ||
      key.includes('.materialCategory') ||
      key.includes('displayStyle') ||
      key.includes('displayValue') ||
      key.includes('displayMesh')
    ) {
      return true
    }

    // handle revit params: the actual one single value we're interested is in parameters.HOST_BLA BLA_.value, the rest are not needed
    if (isRevitProperty(key)) {
      if (key.endsWith('.value')) return false
      else return true
    }

    return false
  }

  /**
   * Filters the available filters to only include relevant ones for the filter UI
   */
  const getRelevantFilters = (
    allFilters: PropertyInfo[] | null | undefined
  ): PropertyInfo[] => {
    return (allFilters || []).filter((f: PropertyInfo) => {
      return !shouldExcludeFromFiltering(f.key)
    })
  }

  /**
   * Determines if a property key should be filterable
   * (exists in available filters and is not excluded)
   */
  const isPropertyFilterable = (
    key: string,
    availableFilters: PropertyInfo[] | null | undefined
  ): boolean => {
    const availableFilterKeys = availableFilters?.map((f: PropertyInfo) => f.key) || []

    // First check if it's in available filters
    if (!availableFilterKeys.includes(key)) {
      return false
    }

    // Then check if it should be excluded
    return !shouldExcludeFromFiltering(key)
  }

  /**
   * Gets a user-friendly display name for a property key
   */
  const getPropertyName = (key: string): string => {
    if (!key) return 'Loading'

    if (key === 'level.name') return 'Level Name'
    if (key === 'speckle_type') return 'Object Type'

    if (isRevitProperty(key) && key.endsWith('.value')) {
      const correspondingProperty = (viewer.metadata.availableFilters.value || []).find(
        (f: PropertyInfo) => f.key === key.replace('.value', '.name')
      )
      if (correspondingProperty && isStringPropertyInfo(correspondingProperty)) {
        return (
          correspondingProperty.valueGroups[0]?.value || key.split('.').pop() || key
        )
      }
    }

    // For all other properties, just return the last part of the path
    return key.split('.').pop() || key
  }

  /**
   * Finds a filter by matching display names (handles complex nested properties)
   */
  const findFilterByDisplayName = (
    displayKey: string,
    availableFilters: PropertyInfo[] | null | undefined
  ): PropertyInfo | undefined => {
    return availableFilters?.find((f) => {
      const backendDisplayName = getPropertyName(f.key)
      return backendDisplayName === displayKey || f.key.split('.').pop() === displayKey
    })
  }

  /**
   * Determines if a key-value pair is filterable (with smart matching for nested properties)
   */
  const isKvpFilterable = (
    kvp: { key: string; backendPath?: string },
    availableFilters: PropertyInfo[] | null | undefined
  ): boolean => {
    // Use backendPath if available, otherwise fall back to display key
    const backendKey = kvp.backendPath || kvp.key

    // First check direct match
    const directMatch = availableFilters?.some((f) => f.key === backendKey)
    if (directMatch) {
      return isPropertyFilterable(backendKey, availableFilters)
    }

    // For complex nested properties, try to find a match by display name
    const displayKey = kvp.key as string
    const matchByDisplayName = findFilterByDisplayName(displayKey, availableFilters)

    if (matchByDisplayName) {
      return isPropertyFilterable(matchByDisplayName.key, availableFilters)
    }

    return false
  }

  /**
   * Gets a detailed reason why a property is disabled for filtering
   */
  const getFilterDisabledReason = (
    kvp: { key: string; backendPath?: string },
    availableFilters: PropertyInfo[] | null | undefined
  ): string => {
    const backendKey = kvp.backendPath || kvp.key
    const availableKeys = availableFilters?.map((f) => f.key) || []

    // Check if it's not in available filters
    if (!availableKeys.includes(backendKey)) {
      // For debugging: show similar keys that might be available
      const similarKeys = availableKeys.filter(
        (key) =>
          key.toLowerCase().includes('type') ||
          key.toLowerCase().includes('category') ||
          key.toLowerCase().includes('class')
      )

      const debugInfo =
        similarKeys.length > 0
          ? ` (Similar available: ${similarKeys.slice(0, 3).join(', ')})`
          : ''

      return `Property '${backendKey}' is not available in backend filters${debugInfo}`
    }

    // Check if it's excluded by filtering logic
    if (shouldExcludeFromFiltering(backendKey)) {
      return `Property '${backendKey}' is excluded from filtering (technical property)`
    }

    return 'This property is not available for filtering'
  }

  /**
   * Finds a filter for a key-value pair using smart matching logic
   */
  const findFilterByKvp = (
    kvp: { key: string; backendPath?: string },
    availableFilters: PropertyInfo[] | null | undefined
  ): PropertyInfo | undefined => {
    // Use backendPath if available, otherwise fall back to display key
    const backendKey = kvp.backendPath || kvp.key

    // First try direct match
    let filter = availableFilters?.find((f: PropertyInfo) => f.key === backendKey)

    // If no direct match, try to find by display name using shared logic
    if (!filter) {
      const displayKey = kvp.key as string
      filter = findFilterByDisplayName(displayKey, availableFilters)
    }

    return filter
  }

  /**
   * Applies color filtering to objects based on a property filter
   */
  const setColorFilter = (filterId: string) => {
    const filter = filters.propertyFilters.value.find((f) => f.id === filterId)
    if (!filter?.filter) return

    const filteringExtension = viewer.instance.getExtension(FilteringExtension)
    filteringExtension.setColorFilter(filter.filter)

    // Update state to track which filter is applying colors
    filters.activeColorFilterId.value = filterId
  }

  /**
   * Removes color filtering from all objects
   */
  const removeColorFilter = () => {
    const filteringExtension = viewer.instance.getExtension(FilteringExtension)
    filteringExtension.removeColorFilter()

    // Clear the active color filter state
    filters.activeColorFilterId.value = null
  }

  /**
   * Toggles color filtering for a specific filter
   */
  const toggleColorFilter = (filterId: string) => {
    // If this filter is already applying colors, turn off colors
    if (filters.activeColorFilterId.value === filterId) {
      removeColorFilter()
    } else {
      // Otherwise, apply colors for this filter (and remove from any other)
      setColorFilter(filterId)
    }
  }

  /**
   * Gets the color groups from the FilteringExtension for the currently active color filter
   */
  const getFilterColorGroups = () => {
    const filteringExtension = viewer.instance.getExtension(FilteringExtension)
    const filteringState = filteringExtension.filteringState

    // Auto-sync: if there are no color groups but we think there's an active filter, clear it
    if (
      (!filteringState.colorGroups || filteringState.colorGroups.length === 0) &&
      filters.activeColorFilterId.value
    ) {
      filters.activeColorFilterId.value = null
    }

    return filteringState.colorGroups || []
  }

  /**
   * Gets the color for a specific filter value
   */
  const getFilterValueColor = (value: string): string | null => {
    const colorGroups = getFilterColorGroups()
    const colorGroup = colorGroups.find((group) => group.value === value)

    if (!colorGroup?.color) return null

    // Ensure the color has a # prefix for CSS
    const color = colorGroup.color
    return color.startsWith('#') ? color : `#${color}`
  }

  return {
    isolateObjects,
    unIsolateObjects,
    hideObjects,
    showObjects,
    filters,
    // Filter value functions
    getAvailableFilterValues,
    // Multi-filter functions
    addActiveFilter,
    removeActiveFilter,
    toggleFilterApplied,
    updateActiveFilterValues,
    updateFilterCondition,
    toggleActiveFilterValue,
    isActiveFilterValueSelected,
    getAppliedFilters,
    resetFilters,
    resetExplode,
    waitForAvailableFilter,
    isRevitProperty,
    shouldExcludeFromFiltering,
    getRelevantFilters,
    isPropertyFilterable,
    getPropertyName,
    findFilterByDisplayName,
    isKvpFilterable,
    getFilterDisabledReason,
    findFilterByKvp,
    // Color filtering functions
    setColorFilter,
    removeColorFilter,
    toggleColorFilter,
    getFilterColorGroups,
    getFilterValueColor,
    // Data store for advanced filtering
    dataStore
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

  const measurementCount = ref(0)

  const measurementOptions = computed(() => state.ui.measurement.options.value)

  const enableMeasurements = (enabled: boolean) => {
    state.ui.measurement.enabled.value = enabled
  }

  const setMeasurementOptions = (options: MeasurementOptions) => {
    state.ui.measurement.options.value = options
  }

  const removeMeasurement = () => {
    state.viewer.instance.getExtension(MeasurementsExtension).removeMeasurement()
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

  const hasMeasurements = computed(() => measurementCount.value > 0)

  const setupMeasurementListener = () => {
    const extension = state.viewer.instance?.getExtension(MeasurementsExtension)
    if (!extension) return

    const updateCount = () => {
      measurementCount.value = (
        extension as unknown as { measurementCount: number }
      ).measurementCount
    }

    // Set initial count
    updateCount()

    // Listen for changes
    extension.on(MeasurementEvent.CountChanged, updateCount)
  }

  if (state.viewer.instance) {
    setupMeasurementListener()
  }

  return {
    measurementOptions,
    enableMeasurements,
    setMeasurementOptions,
    removeMeasurement,
    clearMeasurements,
    getActiveMeasurement,
    hasMeasurements
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

  const resetViewMode = () => {
    setViewMode(ViewMode.DEFAULT)
    edgesEnabled.value = true
    edgesWeight.value = 1
    outlineOpacity.value = 0.75
    edgesColor.value = defaultColor.value
  }

  return {
    currentViewMode,
    setViewMode,
    edgesEnabled,
    toggleEdgesEnabled,
    edgesWeight,
    setEdgesWeight,
    setEdgesColor,
    edgesColor,
    resetViewMode
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
