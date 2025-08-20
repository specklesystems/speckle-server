import { TIME_MS, timeoutAt } from '@speckle/shared'
import type { PropertyInfo } from '@speckle/viewer'
import { Hash, CaseLower } from 'lucide-vue-next'
import { FilteringExtension } from '@speckle/viewer'
import { until } from '@vueuse/shared'
import { difference, uniq } from 'lodash-es'
import {
  useInjectedViewerState,
  type InjectableViewerState
} from '~~/lib/viewer/composables/setup'
import {
  isStringPropertyInfo,
  isNumericPropertyInfo
} from '~/lib/viewer/helpers/sceneExplorer'
import { FilterCondition } from '~/lib/viewer/helpers/filters/types'
import { useObjectDataStore } from '~~/composables/viewer/useObjectDataStore'
import { useOnViewerLoadComplete } from '~~/lib/viewer/composables/viewer'

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

  /**
   * Determine the type of a property
   */
  const getPropertyType = (filter: PropertyInfo): 'number' | 'string' => {
    if (isNumericPropertyInfo(filter)) {
      return 'number'
    }
    return 'string'
  }

  /**
   * Get the appropriate icon component for a property type
   */
  const getPropertyTypeIcon = (type: 'number' | 'string') => {
    switch (type) {
      case 'number':
        return Hash
      case 'string':
      default:
        return CaseLower
    }
  }

  /**
   * Get the appropriate CSS classes for a property type icon
   */
  const getPropertyTypeIconClasses = (type: 'number' | 'string'): string => {
    switch (type) {
      case 'number':
        return 'text-green-300'
      case 'string':
      default:
        return 'text-violet-500'
    }
  }

  /**
   * Get both icon and classes for a property type in one call
   */
  const getPropertyTypeDisplay = (type: 'number' | 'string') => {
    return {
      icon: getPropertyTypeIcon(type),
      classes: getPropertyTypeIconClasses(type)
    }
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
    // Property type functions
    getPropertyType,
    getPropertyTypeIcon,
    getPropertyTypeIconClasses,
    getPropertyTypeDisplay,
    // Data store for advanced filtering
    dataStore
  }
}
