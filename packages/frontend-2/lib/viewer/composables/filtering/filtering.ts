import type {
  PropertyInfo,
  NumericPropertyInfo,
  StringPropertyInfo
} from '@speckle/viewer'
import { difference, uniq, partition } from 'lodash-es'
import {
  useInjectedViewerState,
  type InjectableViewerState
} from '~~/lib/viewer/composables/setup'
import { isNumericPropertyInfo } from '~/lib/viewer/helpers/sceneExplorer'
import {
  type FilterCondition,
  FilterLogic,
  FilterType,
  type FilterData,
  type NumericFilterData,
  type StringFilterData,
  type CreateFilterParams,
  isNumericFilter,
  NumericFilterCondition,
  StringFilterCondition,
  ExistenceFilterCondition,
  SortMode,
  type DataSlice,
  type QueryCriteria
} from '~/lib/viewer/helpers/filters/types'
import { getConditionLabel } from '~/lib/viewer/helpers/filters/constants'
import { useFilteringDataStore } from '~/lib/viewer/composables/filtering/dataStore'
import {
  shouldExcludeFromFiltering,
  getPropertyName,
  isKvpFilterable,
  getFilterDisabledReason,
  findFilterByKvp
} from '~/lib/viewer/helpers/filters/utils'
import { useFilterColoringHelpers } from '~/lib/viewer/composables/filtering/coloringHelpers'

export function useFilterUtilities(
  options?: Partial<{ state: InjectableViewerState }>
) {
  const state = options?.state || useInjectedViewerState()
  const {
    ui: { filters, explodeFactor }
  } = state

  const dataStore = useFilteringDataStore()
  const { removeColorFilter } = useFilterColoringHelpers({ state })

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
  }

  const unIsolateObjects = (objectIds: string[]) => {
    filters.isolatedObjectIds.value = difference(
      filters.isolatedObjectIds.value,
      objectIds
    )
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
  }

  const showObjects = (objectIds: string[]) => {
    filters.hiddenObjectIds.value = difference(filters.hiddenObjectIds.value, objectIds)
  }

  /**
   * Gets ALL values for a property using pre-computed data (used for filtering logic)
   */
  const getAllPropertyValues = (propertyKey: string): string[] => {
    const allValues: string[] = []

    for (const dataSource of dataStore.dataSources.value) {
      // Check if property exists in propertyMap first (quick check)
      const propertyInfo = dataSource.propertyMap[propertyKey]
      if (!propertyInfo) {
        continue
      }

      // Collect values from pre-computed object properties
      for (const [, objProps] of Object.entries(dataSource.objectProperties)) {
        const value = objProps[propertyKey]
        if (value !== undefined) {
          allValues.push(String(value))
        }
      }
    }

    // Remove duplicates and filter out null/undefined values
    return [...new Set(allValues)].filter(
      (v) => v !== null && v !== undefined && v !== 'null' && v !== 'undefined'
    )
  }

  /**
   * Gets available values for the current property filter (used for UI display)
   */
  const getAvailableFilterValues = (filter: PropertyInfo, limit?: number): string[] => {
    // Type guard to check if filter has valueGroups property
    const hasValueGroups = (
      f: PropertyInfo
    ): f is PropertyInfo & { valueGroups: Array<{ value: string | number }> } => {
      return (
        'valueGroups' in f && Array.isArray((f as Record<string, unknown>).valueGroups)
      )
    }

    if (hasValueGroups(filter)) {
      const values = filter.valueGroups
        .map((vg) => String(vg.value))
        .filter(
          (v) => v !== null && v !== undefined && v !== 'null' && v !== 'undefined'
        )

      return limit ? values.slice(0, limit) : values
    }

    return []
  }

  /**
   * Computes full property data for a given property key (min/max, valueGroups)
   */
  const computeFullPropertyData = (propertyKey: string): PropertyInfo | null => {
    const valueToObjectIds = new Map<string, string[]>()

    for (const dataSource of dataStore.dataSources.value) {
      // Check if property exists in this data source
      if (!dataSource.propertyMap[propertyKey]) {
        continue
      }

      // Collect values and their associated object IDs using pre-computed data
      for (const [objectId, objProps] of Object.entries(dataSource.objectProperties)) {
        const value = objProps[propertyKey]
        if (value !== undefined) {
          const stringValue = String(value)
          if (!valueToObjectIds.has(stringValue)) {
            valueToObjectIds.set(stringValue, [])
          }
          valueToObjectIds.get(stringValue)!.push(objectId)
        }
      }
    }

    if (valueToObjectIds.size === 0) {
      return null
    }

    const uniqueValues = Array.from(valueToObjectIds.keys())
    const firstValue = uniqueValues[0]
    const isNumeric =
      typeof firstValue === 'number' ||
      (!isNaN(Number(firstValue)) && String(firstValue) !== '')

    if (isNumeric) {
      const numericValues = uniqueValues.map((v) => Number(v)).filter((v) => !isNaN(v))
      const min = parseFloat(Math.min(...numericValues).toFixed(4))
      const max = parseFloat(Math.max(...numericValues).toFixed(4))

      const numericValueGroups: { value: number; id: string }[] = []
      for (const value of uniqueValues) {
        const objectIds = valueToObjectIds.get(value) || []
        for (const objectId of objectIds) {
          numericValueGroups.push({
            value: Number(value),
            id: objectId
          })
        }
      }

      return {
        key: propertyKey,
        type: 'number',
        objectCount: valueToObjectIds.size,
        min,
        max,
        valueGroups: numericValueGroups,
        passMin: null,
        passMax: null
      } as NumericPropertyInfo
    } else {
      return {
        key: propertyKey,
        type: 'string',
        objectCount: valueToObjectIds.size,
        valueGroups: uniqueValues.map((value) => ({
          value: String(value),
          ids: valueToObjectIds.get(value) || []
        }))
      } as StringPropertyInfo
    }
  }

  const createFilterData = (params: CreateFilterParams): FilterData => {
    const { filter, id } = params

    // If the filter doesn't have full data, compute it now
    const fullFilter =
      filter.objectCount === 0 ? computeFullPropertyData(filter.key) || filter : filter

    if (isNumericPropertyInfo(fullFilter)) {
      const numericFilter = fullFilter as NumericPropertyInfo
      const { min, max } = numericFilter
      const range = max - min

      // Handle filters with meaningless ranges by defaulting to existence-based filtering
      const MIN_MEANINGFUL_RANGE = 1e-10
      const hasConstantValue = range === 0
      const hasNearZeroRange = range > 0 && range < MIN_MEANINGFUL_RANGE

      if (hasConstantValue || hasNearZeroRange) {
        const reason = hasConstantValue
          ? `All objects have the same value (${min})`
          : `Range too small for meaningful filtering (${range.toExponential()})`

        return {
          id,
          isApplied: true,
          selectedValues: [],
          condition: ExistenceFilterCondition.IsSet,
          type: FilterType.Numeric,
          filter: numericFilter,
          numericRange: { min, max },
          hasConstantValue,
          hasNearZeroRange,
          rangeDisabledReason: reason
        } as NumericFilterData
      }

      return {
        id,
        isApplied: true,
        selectedValues: [],
        condition: NumericFilterCondition.IsBetween,
        type: FilterType.Numeric,
        filter: numericFilter,
        numericRange: { min, max }
      } as NumericFilterData
    } else {
      return {
        id,
        isApplied: true,
        selectedValues: [],
        condition: StringFilterCondition.Is,
        type: FilterType.String,
        filter: fullFilter as StringPropertyInfo,
        isDefaultAllSelected: true
      } as StringFilterData
    }
  }

  const addActiveFilter = (filter: PropertyInfo): string => {
    const existingIndex = filters.propertyFilters.value.findIndex(
      (f) => f.filter?.key === filter.key
    )

    if (existingIndex !== -1) {
      return filters.propertyFilters.value[existingIndex].id
    } else {
      const id = `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const filterData = createFilterData({ filter, id })
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

    const newFilterData = createFilterData({
      filter: newProperty,
      id: filterId
    })

    if (filters.activeColorFilterId.value === filterId) {
      removeColorFilter()
    }

    filters.propertyFilters.value[filterIndex] = newFilterData

    updateDataStoreSlices()
    return true
  }

  /**
   * Removes an active filter by ID
   */
  const removeActiveFilter = (filterId: string) => {
    const index = filters.propertyFilters.value.findIndex((f) => f.id === filterId)
    if (index !== -1) {
      if (filters.activeColorFilterId.value === filterId) {
        removeColorFilter()
      }
      filters.propertyFilters.value.splice(index, 1)
      updateDataStoreSlices()
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

      if (!isNumericFilter(filter) && filter.isDefaultAllSelected) {
        filter.isDefaultAllSelected = false
      }

      updateDataStoreSlices()
    }
  }

  /**
   * Efficiently selects all values by using valueGroups directly instead of expensive getAllPropertyValues
   */
  const selectAllFilterValues = (filterId: string) => {
    const filter = filters.propertyFilters.value.find((f) => f.id === filterId)
    if (filter && !isNumericFilter(filter)) {
      const propertyFilter = filter.filter

      if (
        'valueGroups' in propertyFilter &&
        Array.isArray(propertyFilter.valueGroups)
      ) {
        filter.selectedValues = propertyFilter.valueGroups
          .map((vg: { value: unknown }) => String(vg.value))
          .filter(
            (v: string) =>
              v !== null && v !== undefined && v !== 'null' && v !== 'undefined'
          )
      } else {
        // Fallback for edge cases
        const allValues = getAllPropertyValues(propertyFilter.key)
        filter.selectedValues = [...allValues]
      }
      filter.isDefaultAllSelected = false

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

      if (
        condition === ExistenceFilterCondition.IsSet ||
        condition === ExistenceFilterCondition.IsNotSet
      ) {
        filter.isApplied = true
      }

      updateDataStoreSlices()
    }
  }

  /**
   * Sets numeric range for a filter
   */
  const setNumericRange = (filterId: string, min: number, max: number) => {
    const filter = filters.propertyFilters.value.find((f) => f.id === filterId)
    if (filter && isNumericFilter(filter)) {
      const roundedMin = parseFloat(min.toFixed(4))
      const roundedMax = parseFloat(max.toFixed(4))

      filter.numericRange = { min: roundedMin, max: roundedMax }

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

  /**
   * Updates data store slices based on current filter state (optimized)
   */
  const updateDataStoreSlices = () => {
    const nonFilterSlices = dataStore.dataSlices.value.filter(
      (slice) => !slice.id.startsWith('filter-')
    )
    dataStore.dataSlices.value = nonFilterSlices

    const newFilterSlices: DataSlice[] = []

    filters.propertyFilters.value.forEach((filter) => {
      if (isNumericFilter(filter) && filter.isApplied) {
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

        newFilterSlices.push(slice)
      } else if (
        !isNumericFilter(filter) &&
        filter.isApplied &&
        (filter.selectedValues.length > 0 ||
          filter.isDefaultAllSelected ||
          filter.condition === ExistenceFilterCondition.IsSet ||
          filter.condition === ExistenceFilterCondition.IsNotSet)
      ) {
        const values =
          filter.isDefaultAllSelected && filter.selectedValues.length === 0
            ? filter.filter.valueGroups
                ?.map((vg) => String(vg.value))
                .filter((v) => v !== 'null' && v !== 'undefined') || []
            : filter.selectedValues

        const { condition } = filter
        const queryCriteria: QueryCriteria = {
          propertyKey: filter.filter.key,
          condition,
          values
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
                } ${
                  filter.isDefaultAllSelected && filter.selectedValues.length === 0
                    ? 'all values'
                    : filter.selectedValues.join(', ')
                }`,
          objectIds: matchingObjectIds
        }
        newFilterSlices.push(slice)
      }
    })

    dataStore.dataSlices.value.push(...newFilterSlices)
    dataStore.computeSliceIntersections()
  }

  /**
   * Toggles a value for a specific active filter
   */
  const toggleActiveFilterValue = (filterId: string, value: string) => {
    const filter = filters.propertyFilters.value.find((f) => f.id === filterId)
    if (filter) {
      const index = filter.selectedValues.indexOf(value)
      const wasSelected = index > -1

      if (!isNumericFilter(filter) && filter.isDefaultAllSelected) {
        filter.selectedValues = [value]
        filter.isDefaultAllSelected = false
      } else {
        if (wasSelected) {
          filter.selectedValues.splice(index, 1)
        } else {
          filter.selectedValues.push(value)
        }
      }
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

  const resetFilters = () => {
    filters.propertyFilters.value = []
    filters.selectedObjects.value = []
    filters.activeColorFilterId.value = null

    dataStore.setFilterLogic(FilterLogic.All)

    const nonFilterSlices = dataStore.dataSlices.value.filter(
      (slice) => !slice.id.startsWith('filter-')
    )
    dataStore.dataSlices.value = nonFilterSlices

    if (nonFilterSlices.length > 0) {
      dataStore.computeSliceIntersections()
    }
  }

  const resetExplode = () => {
    explodeFactor.value = 0
  }

  /**
   * Restores filters from serialized state
   */
  const restoreFilters = async (
    serializedFilters: Array<{
      key: string | null
      isApplied: boolean
      selectedValues: string[]
      id: string
      condition: 'AND' | 'OR'
    }>
  ) => {
    if (!serializedFilters?.length) return

    resetFilters() // Clear existing filters first

    const availableProperties = getPropertyOptionsFromDataStore()

    for (const serializedFilter of serializedFilters) {
      if (serializedFilter.key) {
        const propertyInfo = availableProperties.find(
          (f) => f.key === serializedFilter.key
        )
        if (propertyInfo) {
          const filterId = addActiveFilter(propertyInfo)

          if (serializedFilter.selectedValues?.length) {
            updateActiveFilterValues(filterId, serializedFilter.selectedValues)
          }

          if (!serializedFilter.isApplied) {
            toggleFilterApplied(filterId)
          }
        }
      }
    }
  }

  /**
   * Filters the available filters to only include relevant ones for the filter UI
   */
  const getRelevantFilters = (
    allFilters: PropertyInfo[] | null | undefined
  ): PropertyInfo[] => {
    return (allFilters || []).filter((f: PropertyInfo) => {
      if (shouldExcludeFromFiltering(f.key)) {
        return false
      }
      return true
    })
  }

  /**
   * Gets property options from the data store (optimized to use propertyMap)
   */
  const getPropertyOptionsFromDataStore = (): PropertyInfo[] => {
    const allProperties = new Map<string, PropertyInfo>()

    for (const dataSource of dataStore.dataSources.value) {
      const propertyKeys = Object.keys(dataSource.propertyMap)

      for (const propertyKey of propertyKeys) {
        if (allProperties.has(propertyKey)) {
          continue
        }

        const propertyInfo = dataSource.propertyMap[propertyKey]
        const value = propertyInfo.value
        const isNumeric =
          typeof value === 'number' || (!isNaN(Number(value)) && String(value) !== '')

        if (isNumeric) {
          allProperties.set(propertyKey, {
            key: propertyKey,
            type: 'number',
            objectCount: 0,
            min: 0,
            max: 0,
            valueGroups: [],
            passMin: null,
            passMax: null
          } as NumericPropertyInfo)
        } else {
          allProperties.set(propertyKey, {
            key: propertyKey,
            type: 'string',
            objectCount: 0, // Not needed for selection
            valueGroups: []
          } as StringPropertyInfo)
        }
      }
    }

    return Array.from(allProperties.values())
  }

  /**
   * Gets filtered and sorted values for a string filter with search and sorting options
   */
  const getFilteredFilterValues = (
    filter: PropertyInfo,
    options?: {
      searchQuery?: string
      sortMode?: SortMode
      filterId?: string
    }
  ): string[] => {
    const { searchQuery, sortMode = SortMode.Alphabetical, filterId } = options || {}

    let values: string[]

    values = getAvailableFilterValues(filter)

    if (searchQuery?.trim()) {
      const searchTerm = searchQuery.toLowerCase().trim()
      values = values.filter((value: string) =>
        value.toLowerCase().includes(searchTerm)
      )
    }

    if (sortMode === SortMode.SelectedFirst && filterId) {
      const [selectedValues, unselectedValues] = partition(values, (value: string) =>
        isActiveFilterValueSelected(filterId, value)
      )

      const sortedSelectedValues = selectedValues.sort((a, b) => a.localeCompare(b))
      const sortedUnselectedValues = unselectedValues.sort((a, b) => a.localeCompare(b))

      return [...sortedSelectedValues, ...sortedUnselectedValues]
    } else {
      return values.sort((a, b) => a.localeCompare(b))
    }
  }

  return {
    isolateObjects,
    unIsolateObjects,
    hideObjects,
    showObjects,
    filters,
    addActiveFilter,
    updateFilterProperty,
    removeActiveFilter,
    toggleFilterApplied,
    updateActiveFilterValues,
    selectAllFilterValues,
    updateFilterCondition,
    setFilterLogic,
    toggleActiveFilterValue,
    isActiveFilterValueSelected,
    resetFilters,
    restoreFilters,
    resetExplode,
    getRelevantFilters,
    getPropertyOptionsFromDataStore,
    getPropertyName,
    isKvpFilterable,
    getFilterDisabledReason,
    findFilterByKvp,
    getFilteredFilterValues,
    setNumericRange
  }
}
