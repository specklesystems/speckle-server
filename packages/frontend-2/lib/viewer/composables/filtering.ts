import { TIME_MS, timeoutAt } from '@speckle/shared'
import type {
  PropertyInfo,
  NumericPropertyInfo,
  StringPropertyInfo,
  SpeckleObject,
  TreeNode,
  Viewer
} from '@speckle/viewer'

import { FilteringExtension } from '@speckle/viewer'
import { until } from '@vueuse/shared'
import { difference, uniq } from 'lodash-es'
import { nextTick } from 'vue'
import {
  useInjectedViewerState,
  type InjectableViewerState
} from '~~/lib/viewer/composables/setup'
import {
  isStringPropertyInfo,
  isNumericPropertyInfo
} from '~/lib/viewer/helpers/sceneExplorer'
import {
  type FilterCondition,
  FilterLogic,
  FilterType,
  type FilterData,
  type NumericFilterData,
  type StringFilterData,
  type PropertyInfoBase,
  type DataSlice,
  type QueryCriteria,
  type DataSource,
  type ResourceInfo,
  type CreateFilterParams,
  isNumericFilter,
  NumericFilterCondition,
  StringFilterCondition,
  ExistenceFilterCondition,
  getConditionLabel
} from '~/lib/viewer/helpers/filters/types'
import { useOnViewerLoadComplete } from '~~/lib/viewer/composables/viewer'

// Internal data store implementation
function createFilteringDataStore() {
  const dataSourcesMap: Ref<Record<string, DataSource>> = ref({})
  const dataSources = computed(() => Object.values(dataSourcesMap.value))
  const currentFilterLogic = ref<FilterLogic>(FilterLogic.All)
  const ghostMode = ref<boolean>(true) // Default to ghosting enabled
  const dataSlices: Ref<DataSlice[]> = ref([])

  const extractNestedProperties = (
    obj: Record<string, unknown>
  ): PropertyInfoBase[] => {
    const properties: PropertyInfoBase[] = []

    function traverse(current: Record<string, unknown>, path: string[] = []) {
      for (const [key, value] of Object.entries(current)) {
        const currentPath = [...path, key]
        const concatenatedPath = currentPath.join('.')

        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          traverse(value as Record<string, unknown>, currentPath)
        } else {
          properties.push({
            concatenatedPath,
            value,
            type: typeof value
          } as PropertyInfoBase)
        }
      }
    }

    traverse(obj)
    return properties
  }

  const populateDataStore = async (viewer: Viewer, resources: ResourceInfo[]) => {
    const tree = viewer.getWorldTree()
    if (!tree) return

    for (const res of resources) {
      const foundNodes = tree.findId(res.resourceUrl)
      const subnode = foundNodes?.[0]
      if (!subnode) {
        continue
      }

      const objectMap: Record<string, SpeckleObject> = {}
      const propertyMap: Record<string, PropertyInfoBase> = {}

      await tree.walkAsync((node: TreeNode) => {
        if (
          node.model.atomic &&
          node.model.raw.id &&
          node.model.raw.id.length === 32 &&
          !node.model.raw.speckle_type?.includes('Proxy') &&
          node.model.raw.properties?.builtInCategory !== 'OST_Levels'
        ) {
          const objectId = node.model.raw.id
          objectMap[objectId] = node.model.raw as SpeckleObject

          const props = extractNestedProperties(node.model.raw)
          for (const p of props) {
            propertyMap[p.concatenatedPath] = p
          }
        }
        return true
      }, subnode)

      const rootObject = subnode.model.raw.children?.[0] as SpeckleObject

      dataSourcesMap.value[res.resourceUrl] = {
        ...res,
        viewerInstance: markRaw(viewer),
        rootObject: rootObject ? markRaw(rootObject) : null,
        objectMap: markRaw(objectMap),
        propertyMap
        // _propertyIndexCache will be built on-demand
      }
    }
  }

  /**
   * Build property index on-demand for a specific property key
   */
  const buildPropertyIndex = (
    dataSource: DataSource,
    propertyKey: string
  ): Record<string, string[]> => {
    // Check if already cached
    if (!dataSource._propertyIndexCache) {
      dataSource._propertyIndexCache = {}
    }

    if (dataSource._propertyIndexCache[propertyKey]) {
      return dataSource._propertyIndexCache[propertyKey]
    }

    // Build index for this property
    const propertyIndex: Record<string, string[]> = {}

    for (const [objectId, speckleObject] of Object.entries(dataSource.objectMap)) {
      const props = extractNestedProperties(speckleObject as SpeckleObject)

      for (const p of props) {
        if (p.concatenatedPath === propertyKey) {
          const value = String(p.value)

          if (!propertyIndex[value]) {
            propertyIndex[value] = []
          }
          propertyIndex[value].push(objectId)
        }
      }
    }

    // Cache the result
    dataSource._propertyIndexCache[propertyKey] = propertyIndex
    return propertyIndex
  }

  const queryObjects = (criteria: QueryCriteria): string[] => {
    const matchingIds: string[] = []

    for (const dataSource of dataSources.value) {
      // Build index on-demand for this specific property
      const propertyIndex = buildPropertyIndex(dataSource, criteria.propertyKey)

      if (!propertyIndex || Object.keys(propertyIndex).length === 0) {
        continue
      }

      // Handle existence conditions first (work for both string and numeric properties)
      if (criteria.condition === ExistenceFilterCondition.IsSet) {
        // "Is Set" returns all objects that have any value for this property
        for (const objectIds of Object.values(propertyIndex)) {
          matchingIds.push(...objectIds)
        }
      } else if (criteria.condition === ExistenceFilterCondition.IsNotSet) {
        // "Is Not Set" returns all objects that DON'T have this property
        // We need to find objects that are not in the propertyIndex
        const objectsWithProperty = new Set<string>()
        for (const objectIds of Object.values(propertyIndex)) {
          for (const objectId of objectIds) {
            objectsWithProperty.add(objectId)
          }
        }

        // Add all objects that don't have this property
        for (const [objectId] of Object.entries(dataSource.objectMap)) {
          if (!objectsWithProperty.has(objectId)) {
            matchingIds.push(objectId)
          }
        }
      }
      // Handle numeric conditions
      else if (criteria.minValue !== undefined || criteria.maxValue !== undefined) {
        const minValue = criteria.minValue ?? -Infinity
        const maxValue = criteria.maxValue ?? Infinity

        for (const [value, objectIds] of Object.entries(propertyIndex)) {
          const numericValue = Number(value)
          if (!isNaN(numericValue)) {
            let shouldInclude = false

            switch (criteria.condition) {
              case NumericFilterCondition.IsBetween:
                shouldInclude = numericValue >= minValue && numericValue <= maxValue
                break
              case NumericFilterCondition.IsGreaterThan:
                shouldInclude = numericValue > minValue
                break
              case NumericFilterCondition.IsLessThan:
                shouldInclude = numericValue < maxValue
                break
              case NumericFilterCondition.IsEqualTo:
                // For numeric "is", check if the value is within the range
                shouldInclude = numericValue >= minValue && numericValue <= maxValue
                break
              case NumericFilterCondition.IsNotEqualTo:
                // For numeric "is not", exclude values within the range
                shouldInclude = numericValue < minValue || numericValue > maxValue
                break
              default:
                // Default to range behavior for backward compatibility
                shouldInclude = numericValue >= minValue && numericValue <= maxValue
            }

            if (shouldInclude) {
              matchingIds.push(...objectIds)
            }
          }
        }
      }
      // Handle string conditions
      else if (criteria.condition === StringFilterCondition.Is) {
        for (const value of criteria.values) {
          const objectIds = propertyIndex[value]
          if (objectIds) {
            matchingIds.push(...objectIds)
          }
        }
      } else if (criteria.condition === StringFilterCondition.IsNot) {
        // If no values selected, "is not" should return no objects
        if (criteria.values.length === 0) {
          // Return empty array - nothing matches "is not" with no exclusions
        } else {
          const excludeValues = new Set(criteria.values)
          for (const [value, objectIds] of Object.entries(propertyIndex)) {
            if (!excludeValues.has(value)) {
              matchingIds.push(...objectIds)
            }
          }
        }
      }
    }

    return matchingIds
  }

  // Cascades the intersected object ids from the previous slice to the current slice
  const computeSliceIntersections = () => {
    if (dataSlices.value.length < 1) return

    // First slice gets all its objects
    dataSlices.value[0]!.intersectedObjectIds = [...dataSlices.value[0]!.objectIds]

    // Each subsequent slice intersects with the previous slice
    for (let i = 1; i < dataSlices.value.length; i++) {
      const prevSlice = dataSlices.value[i - 1]!
      const currentSlice = dataSlices.value[i]!
      currentSlice.intersectedObjectIds = currentSlice.objectIds.filter((id) =>
        prevSlice.intersectedObjectIds!.includes(id)
      )
    }
  }

  const pushOrReplaceSlice = (dataSlice: DataSlice) => {
    const sliceByWidgetIdIndex = dataSlices.value.findIndex(
      (slice) => slice.widgetId === dataSlice.widgetId
    )
    if (sliceByWidgetIdIndex === -1) {
      // If it's not present, push
      dataSlices.value.push(dataSlice)
    } else {
      // If it's the same name, toggle off (remove slice)
      if (dataSlices.value[sliceByWidgetIdIndex]!.name === dataSlice.name) {
        popSlice(dataSlice)
        return
      } else {
        // Replace slice if it's a new slice coming from an existing widget
        dataSlices.value[sliceByWidgetIdIndex] = dataSlice
      }
    }

    computeSliceIntersections()
  }

  const popSlice = (dataSlice: DataSlice) => {
    const sliceByWidgetIdIndex = dataSlices.value.findIndex(
      (slice) => slice.widgetId === dataSlice.widgetId
    )
    if (sliceByWidgetIdIndex !== -1) {
      dataSlices.value.splice(sliceByWidgetIdIndex, 1)
      computeSliceIntersections()
    }
  }

  const getFinalObjectIds = (): string[] => {
    if (dataSlices.value.length === 0) return []

    if (currentFilterLogic.value === FilterLogic.Any) {
      // Union: combine all objects from all slices
      const allObjectIds = new Set<string>()
      for (const slice of dataSlices.value) {
        if (slice.objectIds && Array.isArray(slice.objectIds)) {
          for (const objectId of slice.objectIds) {
            if (objectId) {
              allObjectIds.add(objectId)
            }
          }
        }
      }
      return Array.from(allObjectIds)
    } else {
      // Intersection: use cascading intersections from last slice
      const lastSlice = dataSlices.value[dataSlices.value.length - 1]
      return lastSlice?.intersectedObjectIds || []
    }
  }

  const clearDataOnRouteLeave = () => {
    dataSourcesMap.value = {}
    dataSlices.value = []
  }

  const setFilterLogic = (logic: FilterLogic) => {
    currentFilterLogic.value = logic
  }

  const setGhostMode = (enabled: boolean) => {
    ghostMode.value = enabled
  }

  const updateViewer = (
    instance: Viewer,
    filters: {
      activeColorFilterId: Ref<string | null>
      propertyFilters: Ref<FilterData[]>
    }
  ) => {
    const objectIds = getFinalObjectIds()
    const filteringExtension = instance.getExtension(FilteringExtension)

    // Always clear existing filters first to prevent accumulation
    filteringExtension.resetFilters()

    // Check if there are any applied filters
    const hasAppliedFilters = filters.propertyFilters.value.some(
      (filter) => filter.isApplied
    )

    if (objectIds.length > 0) {
      // Isolate the matching objects (ghost parameter controls transparency vs hiding)
      filteringExtension.isolateObjects(
        objectIds,
        'property-filters',
        true,
        ghostMode.value
      )
    } else if (hasAppliedFilters) {
      // When no objects match but filters are applied, isolate a fake object ID to ghost/hide everything
      // This provides better visual feedback than completely hiding everything
      filteringExtension.isolateObjects(
        ['no-match-ghost-all'],
        'property-filters',
        true,
        ghostMode.value
      )
    }
    // If no applied filters and no objects match, do nothing - return to unfiltered state

    // Restore color filter if it was active
    const currentColorFilterId = filters.activeColorFilterId.value
    if (currentColorFilterId) {
      const activeFilter = filters.propertyFilters.value.find(
        (f: FilterData) => f.id === currentColorFilterId
      )
      if (activeFilter?.filter) {
        filteringExtension.setColorFilter(activeFilter.filter)
      }
    }
  }

  return {
    populateDataStore,
    queryObjects,
    pushOrReplaceSlice,
    popSlice,
    computeSliceIntersections,
    getFinalObjectIds,
    updateViewer,
    clearDataOnRouteLeave,
    setFilterLogic,
    currentFilterLogic,
    setGhostMode,
    ghostMode,
    dataSlices
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

  // Initialize internal data store for filtering
  const dataStore = createFilteringDataStore()

  // Populate data store when viewer loads models
  if (import.meta.client) {
    const { instance } = viewer
    const { resourceItems } = state.resources.response

    const populateInternalDataStore = async () => {
      const tree = instance.getWorldTree()
      if (!tree || !resourceItems.value.length) {
        return
      }

      // Check if resources are actually available in the world tree
      const availableResources = resourceItems.value.filter((item) => {
        const nodes = tree.findId(item.objectId)
        return nodes && nodes.length > 0
      })

      if (availableResources.length === 0) {
        return
      }

      // Clear and repopulate the entire data store
      dataStore.clearDataOnRouteLeave()

      const resources = availableResources.map((item) => ({
        resourceUrl: item.objectId
      }))

      await dataStore.populateDataStore(instance, resources)
    }

    // Populate whenever a model finishes loading
    useOnViewerLoadComplete(async () => {
      await populateInternalDataStore()
    })

    // Also try to populate immediately if resources are already available
    nextTick(() => {
      if (resourceItems.value.length > 0) {
        populateInternalDataStore()
      }
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
    filteringExtension.isolateObjects(objectIds, 'manual-isolation', true, true)
  }

  const unIsolateObjects = (objectIds: string[]) => {
    filters.isolatedObjectIds.value = difference(
      filters.isolatedObjectIds.value,
      objectIds
    )
    const filteringExtension = viewer.instance.getExtension(FilteringExtension)
    filteringExtension.unIsolateObjects(objectIds, 'manual-isolation', true, true)
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
    filteringExtension.hideObjects(objectIds, 'manual-hiding', false, false)
  }

  const showObjects = (objectIds: string[]) => {
    filters.hiddenObjectIds.value = difference(filters.hiddenObjectIds.value, objectIds)
    const filteringExtension = viewer.instance.getExtension(FilteringExtension)
    filteringExtension.showObjects(objectIds, 'manual-hiding', false)
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
   * Creates a properly typed FilterData object from PropertyInfo
   */
  const createFilterData = (params: CreateFilterParams): FilterData => {
    const { filter, id, availableValues } = params

    if (isNumericPropertyInfo(filter)) {
      return {
        id,
        isApplied: true,
        selectedValues: [],
        condition: NumericFilterCondition.IsBetween,
        type: FilterType.Numeric,
        filter: filter as NumericPropertyInfo,
        numericRange: {
          min: (filter as NumericPropertyInfo).min,
          max: (filter as NumericPropertyInfo).max
        }
      } satisfies NumericFilterData
    } else {
      return {
        id,
        isApplied: true,
        selectedValues: [...availableValues], // Select all values by default
        condition: StringFilterCondition.Is,
        type: FilterType.String,
        filter: filter as StringPropertyInfo,
        numericRange: { min: 0, max: 100 }, // Default range for consistency
        isDefaultAllSelected: true // Track that this is the initial "all selected" state
      } satisfies StringFilterData
    }
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
      // Add new filter with all values selected by default
      const id = `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const availableValues = getAvailableFilterValues(filter)

      const filterData = createFilterData({ filter, id, availableValues })
      filters.propertyFilters.value.push(filterData)

      updateDataStoreSlices()
      return id
    }
  }

  /**
   * Updates the property of an existing filter while preserving its position and settings
   */
  const updateFilterProperty = (
    filterId: string,
    newProperty: PropertyInfo
  ): boolean => {
    const filterIndex = filters.propertyFilters.value.findIndex(
      (f) => f.id === filterId
    )
    if (filterIndex === -1) return false

    const availableValues = getAvailableFilterValues(newProperty)

    // Create new filter data with the new property but preserve the filter ID and position
    const newFilterData = createFilterData({
      filter: newProperty,
      id: filterId,
      availableValues
    })

    // If this filter was applying colors, remove the color filter since property changed
    if (filters.activeColorFilterId.value === filterId) {
      removeColorFilter()
    }

    // Replace the filter at the same index to preserve order
    filters.propertyFilters.value[filterIndex] = newFilterData

    updateDataStoreSlices()
    return true
  }

  /**
   * Removes an active filter by ID
   */
  const removeActiveFilter = (filterId: string) => {
    const instance = viewer.instance
    const index = filters.propertyFilters.value.findIndex((f) => f.id === filterId)
    if (index !== -1) {
      // If this filter was applying colors, remove the color filter
      if (filters.activeColorFilterId.value === filterId) {
        removeColorFilter()
      }
      filters.propertyFilters.value.splice(index, 1)

      updateDataStoreSlices()
      // If this was the last filter, explicitly reset the viewer
      if (filters.propertyFilters.value.length === 0) {
        const filteringExtension = instance.getExtension(FilteringExtension)
        filteringExtension.resetFilters()
      }
    }
  }

  /**
   * Toggles the applied state of a specific filter
   */
  const toggleFilterApplied = (filterId: string) => {
    const filter = filters.propertyFilters.value.find((f) => f.id === filterId)
    if (filter) {
      filter.isApplied = !filter.isApplied
      updateDataStoreSlices()
    }
  }

  /**
   * Updates selected values for a specific active filter
   */
  const updateActiveFilterValues = (filterId: string, values: string[]) => {
    const filter = filters.propertyFilters.value.find((f) => f.id === filterId)
    if (filter) {
      filter.selectedValues = [...values]

      // Clear the default all-selected state when user updates values
      if (!isNumericFilter(filter) && filter.isDefaultAllSelected) {
        filter.isDefaultAllSelected = false
      }

      updateDataStoreSlices()
    }
  }

  /**
   * Updates condition for a specific active filter
   */
  const updateFilterCondition = (filterId: string, condition: FilterCondition) => {
    const filter = filters.propertyFilters.value.find((f) => f.id === filterId)
    if (filter) {
      filter.condition = condition
      updateDataStoreSlices()
    }
  }

  /**
   * Sets numeric range for a filter
   */
  const setNumericRange = (filterId: string, min: number, max: number) => {
    const filter = filters.propertyFilters.value.find((f) => f.id === filterId)
    if (filter && isNumericFilter(filter)) {
      // Update numeric range using type-safe access
      filter.numericRange = { min, max }

      // Mark filter as applied
      if (!filter.isApplied) {
        filter.isApplied = true
      }
      updateDataStoreSlices()
    }
  }

  /**
   * Sets filter logic and updates slices
   */
  const setFilterLogic = (logic: FilterLogic) => {
    dataStore.setFilterLogic(logic)
    updateDataStoreSlices()
  }

  const setGhostMode = (enabled: boolean) => {
    dataStore.setGhostMode(enabled)
    updateDataStoreSlices()
  }

  /**
   * Updates data store slices based on current filter state (optimized)
   */
  const updateDataStoreSlices = () => {
    // Clear all existing filter slices
    dataStore.dataSlices.value = dataStore.dataSlices.value.filter(
      (slice) => !slice.id.startsWith('filter-')
    )

    // Create new slices for active filters (simple forEach)
    filters.propertyFilters.value.forEach((filter) => {
      // Handle numeric filters - create slice if filter is enabled AND (has numeric range OR is "is set" OR is "is not set")
      if (
        isNumericFilter(filter) &&
        filter.isApplied &&
        (filter.condition === ExistenceFilterCondition.IsSet ||
          filter.condition === ExistenceFilterCondition.IsNotSet ||
          filter.numericRange.min !== filter.filter.min ||
          filter.numericRange.max !== filter.filter.max)
      ) {
        const queryCriteria: QueryCriteria = {
          propertyKey: filter.filter.key,
          condition: filter.condition,
          values: [],
          minValue: filter.numericRange.min,
          maxValue: filter.numericRange.max
        }
        const matchingObjectIds = dataStore.queryObjects(queryCriteria)

        const slice: DataSlice = {
          id: `filter-${filter.id}`,
          widgetId: filter.id,
          name:
            filter.condition === ExistenceFilterCondition.IsSet
              ? `${getPropertyName(filter.filter.key)} is set`
              : filter.condition === ExistenceFilterCondition.IsNotSet
              ? `${getPropertyName(filter.filter.key)} is not set`
              : `${getPropertyName(filter.filter.key)} ${getConditionLabel(
                  filter.condition
                )} (${filter.numericRange.min.toFixed(
                  2
                )} - ${filter.numericRange.max.toFixed(2)})`,
          objectIds: matchingObjectIds
        }
        dataStore.dataSlices.value.push(slice)
      }
      // Handle string filters - create slice if filter is enabled AND (has selected values OR is "is set" OR is "is not set")
      else if (
        !isNumericFilter(filter) &&
        filter.isApplied &&
        (filter.selectedValues.length > 0 ||
          filter.condition === ExistenceFilterCondition.IsSet ||
          filter.condition === ExistenceFilterCondition.IsNotSet)
      ) {
        const queryCriteria: QueryCriteria = {
          propertyKey: filter.filter.key,
          condition: filter.condition,
          values: filter.selectedValues
        }
        const matchingObjectIds = dataStore.queryObjects(queryCriteria)

        const slice: DataSlice = {
          id: `filter-${filter.id}`,
          widgetId: filter.id,
          name:
            filter.condition === ExistenceFilterCondition.IsSet
              ? `${getPropertyName(filter.filter.key)} is set`
              : filter.condition === ExistenceFilterCondition.IsNotSet
              ? `${getPropertyName(filter.filter.key)} is not set`
              : `${getPropertyName(filter.filter.key)} ${
                  filter.condition === StringFilterCondition.Is ? 'is' : 'is not'
                } ${filter.selectedValues.join(', ')}`,
          objectIds: matchingObjectIds
        }
        dataStore.dataSlices.value.push(slice)
      }
    })

    dataStore.computeSliceIntersections()

    if (import.meta.client) {
      dataStore.updateViewer(viewer.instance, filters)
    }
  }

  /**
   * Toggles a value for a specific active filter
   */
  const toggleActiveFilterValue = (filterId: string, value: string) => {
    const filter = filters.propertyFilters.value.find((f) => f.id === filterId)
    if (filter) {
      const index = filter.selectedValues.indexOf(value)
      const wasSelected = index > -1

      // Special behavior for default all-selected state: first click selects only that item
      if (!isNumericFilter(filter) && filter.isDefaultAllSelected) {
        filter.selectedValues = [value] // Select only this item
        filter.isDefaultAllSelected = false // Clear default state
      } else {
        // Normal toggle behavior
        if (wasSelected) {
          filter.selectedValues.splice(index, 1)
        } else {
          filter.selectedValues.push(value)
        }
      }

      // Don't change isApplied here - that's controlled by the visibility toggle
      // isApplied represents whether the filter is enabled, not whether it has values

      updateDataStoreSlices()
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
   * Checks if a filter has content (selected values or numeric range)
   */
  const filterHasContent = (filter: FilterData): boolean => {
    if (isNumericFilter(filter)) {
      // For numeric filters, check if range is different from default OR if it's a special condition that doesn't need values
      if (
        filter.condition === ExistenceFilterCondition.IsSet ||
        filter.condition === ExistenceFilterCondition.IsNotSet
      ) {
        return true
      }
      const defaultMin = filter.filter.min
      const defaultMax = filter.filter.max
      return (
        filter.numericRange.min !== defaultMin || filter.numericRange.max !== defaultMax
      )
    } else {
      // For string filters, check if any values are selected OR if it's a special condition that doesn't need values
      if (
        filter.condition === ExistenceFilterCondition.IsSet ||
        filter.condition === ExistenceFilterCondition.IsNotSet
      ) {
        return true
      }
      return filter.selectedValues.length > 0
    }
  }

  /**
   * Gets all currently applied filters
   */
  const getAppliedFilters = () => {
    return filters.propertyFilters.value.filter((f) => f.isApplied)
  }

  const resetFilters = () => {
    // Clear all filter state
    filters.propertyFilters.value = []
    filters.selectedObjects.value = []
    filters.activeColorFilterId.value = null

    // Reset filter logic to default
    dataStore.setFilterLogic(FilterLogic.All)

    // Clear all filter slices
    const nonFilterSlices = dataStore.dataSlices.value.filter(
      (slice) => !slice.id.startsWith('filter-')
    )
    dataStore.dataSlices.value = nonFilterSlices

    // Only compute intersections if there are slices remaining
    if (nonFilterSlices.length > 0) {
      dataStore.computeSliceIntersections()
    }

    // Explicitly reset viewer - don't rely on watch since it might skip
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

    // Always remove existing color filter first to ensure clean switch
    filteringExtension.removeColorFilter()

    // Then set the new color filter
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
    getAvailableFilterValues,
    addActiveFilter,
    updateFilterProperty,
    removeActiveFilter,
    toggleFilterApplied,
    updateActiveFilterValues,
    updateFilterCondition,

    setFilterLogic,
    setGhostMode,
    updateDataStoreSlices,
    toggleActiveFilterValue,
    isActiveFilterValueSelected,
    filterHasContent,
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
    // Numeric range filtering
    setNumericRange,
    // Filter logic
    currentFilterLogic: dataStore.currentFilterLogic,
    getFinalObjectIds: dataStore.getFinalObjectIds,
    // Ghost mode
    ghostMode: dataStore.ghostMode
  }
}
