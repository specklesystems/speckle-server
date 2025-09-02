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
import {
  difference,
  uniq,
  flatten,
  isEmpty,
  partition,
  compact,
  mapValues,
  round
} from 'lodash-es'
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
  getConditionLabel,
  SortMode
} from '~/lib/viewer/helpers/filters/types'
import { useOnViewerLoadComplete } from '~~/lib/viewer/composables/viewer'

// Internal data store implementation
function createFilteringDataStore() {
  const dataSourcesMap: Ref<Record<string, DataSource>> = ref({})
  const dataSources = computed(() => Object.values(dataSourcesMap.value))
  const currentFilterLogic = ref<FilterLogic>(FilterLogic.All)
  const dataSlices: Ref<DataSlice[]> = ref([])

  let propertyExtractionCache = new WeakMap<
    Record<string, unknown>,
    PropertyInfoBase[]
  >()

  const extractNestedProperties = (
    obj: Record<string, unknown>
  ): PropertyInfoBase[] => {
    if (propertyExtractionCache.has(obj)) {
      return propertyExtractionCache.get(obj)!
    }

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
    propertyExtractionCache.set(obj, properties)
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
      }
    }
  }

  const buildPropertyIndex = (
    dataSource: DataSource,
    propertyKey: string
  ): Record<string, string[]> => {
    if (!dataSource._propertyIndexCache) {
      dataSource._propertyIndexCache = {}
    }

    if (dataSource._propertyIndexCache[propertyKey]) {
      return dataSource._propertyIndexCache[propertyKey]
    }

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

    dataSource._propertyIndexCache[propertyKey] = propertyIndex
    return propertyIndex
  }

  const queryObjects = (criteria: QueryCriteria): string[] => {
    const matchingIds: string[] = []

    const PRECISION = 4 // matches 0.0001 step

    for (const dataSource of dataSources.value) {
      const propertyIndex = buildPropertyIndex(dataSource, criteria.propertyKey)

      if (!propertyIndex || isEmpty(propertyIndex)) {
        continue
      }

      if (criteria.condition === ExistenceFilterCondition.IsSet) {
        matchingIds.push(...flatten(Object.values(propertyIndex)))
      } else if (criteria.condition === ExistenceFilterCondition.IsNotSet) {
        const objectsWithProperty = new Set<string>(
          flatten(Object.values(propertyIndex))
        )

        for (const [objectId] of Object.entries(dataSource.objectMap)) {
          if (!objectsWithProperty.has(objectId)) {
            matchingIds.push(objectId)
          }
        }
      } else if (criteria.minValue !== undefined || criteria.maxValue !== undefined) {
        const minValue = criteria.minValue ?? -Infinity
        const maxValue = criteria.maxValue ?? Infinity

        for (const [value, objectIds] of Object.entries(propertyIndex)) {
          const numericValue = Number(value)
          if (!isNaN(numericValue)) {
            // Round values to match our precision to avoid floating-point issues
            const roundedValue = round(numericValue, PRECISION)
            const roundedMin = round(minValue, PRECISION)
            const roundedMax = round(maxValue, PRECISION)

            let shouldInclude = false

            switch (criteria.condition) {
              case NumericFilterCondition.IsBetween:
                shouldInclude = roundedValue >= roundedMin && roundedValue <= roundedMax
                break
              case NumericFilterCondition.IsGreaterThan:
                shouldInclude = roundedValue > roundedMin
                break
              case NumericFilterCondition.IsLessThan:
                shouldInclude = roundedValue < roundedMax
                break
              case NumericFilterCondition.IsEqualTo:
                shouldInclude = roundedValue >= roundedMin && roundedValue <= roundedMax
                break
              case NumericFilterCondition.IsNotEqualTo:
                shouldInclude = roundedValue < roundedMin || roundedValue > roundedMax
                break
              default:
                shouldInclude = roundedValue >= roundedMin && roundedValue <= roundedMax
            }

            if (shouldInclude) {
              matchingIds.push(...objectIds)
            }
          }
        }
      } else if (criteria.condition === StringFilterCondition.Is) {
        for (const value of criteria.values) {
          const objectIds = propertyIndex[value]
          if (objectIds) {
            matchingIds.push(...objectIds)
          }
        }
      } else if (criteria.condition === StringFilterCondition.IsNot) {
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

  const computeSliceIntersections = () => {
    if (dataSlices.value.length < 1) return

    if (currentFilterLogic.value === FilterLogic.All) {
      dataSlices.value[0]!.intersectedObjectIds = [...dataSlices.value[0]!.objectIds]

      for (let i = 1; i < dataSlices.value.length; i++) {
        const prevSlice = dataSlices.value[i - 1]!
        const currentSlice = dataSlices.value[i]!
        currentSlice.intersectedObjectIds = currentSlice.objectIds.filter((id) =>
          prevSlice.intersectedObjectIds!.includes(id)
        )
      }
    } else {
      for (const slice of dataSlices.value) {
        slice.intersectedObjectIds = []
      }
    }
  }

  const pushOrReplaceSlice = (dataSlice: DataSlice) => {
    const sliceByWidgetIdIndex = dataSlices.value.findIndex(
      (slice) => slice.widgetId === dataSlice.widgetId
    )
    if (sliceByWidgetIdIndex === -1) {
      dataSlices.value.push(dataSlice)
    } else {
      if (dataSlices.value[sliceByWidgetIdIndex]!.name === dataSlice.name) {
        popSlice(dataSlice)
        return
      } else {
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
      const validObjectIds = compact(
        flatten(
          dataSlices.value
            .filter((slice) => slice.objectIds && Array.isArray(slice.objectIds))
            .map((slice) => slice.objectIds)
        )
      )
      return uniq(validObjectIds)
    } else {
      const lastSlice = dataSlices.value[dataSlices.value.length - 1]
      return lastSlice?.intersectedObjectIds || []
    }
  }

  const clearDataOnRouteLeave = () => {
    dataSourcesMap.value = {}
    dataSlices.value = []
    propertyExtractionCache = new WeakMap()
  }

  const setFilterLogic = (logic: FilterLogic) => {
    currentFilterLogic.value = logic
    computeSliceIntersections()
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

    filteringExtension.resetFilters()

    const hasAppliedFilters = filters.propertyFilters.value.some(
      (filter) => filter.isApplied
    )

    if (objectIds.length > 0) {
      filteringExtension.isolateObjects(objectIds, 'property-filters', true)
    } else if (hasAppliedFilters) {
      filteringExtension.isolateObjects(
        ['no-match-ghost-all'],
        'property-filters',
        true
      )
    }

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
    dataSlices,
    dataSources,
    buildPropertyIndex
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

  const dataStore = createFilteringDataStore()

  if (import.meta.client) {
    const { instance } = viewer
    const { resourceItems } = state.resources.response

    const populateInternalDataStore = async () => {
      const tree = instance.getWorldTree()
      if (!tree || !resourceItems.value.length) {
        return
      }

      const availableResources = resourceItems.value.filter((item) => {
        const nodes = tree.findId(item.objectId)
        return nodes && nodes.length > 0
      })

      if (availableResources.length === 0) {
        return
      }

      dataStore.clearDataOnRouteLeave()

      const resources = availableResources.map((item) => ({
        resourceUrl: item.objectId
      }))

      await dataStore.populateDataStore(instance, resources)
    }

    useOnViewerLoadComplete(async () => {
      await populateInternalDataStore()
    })

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

  const getPropertyValueCounts = (propertyKey: string): Record<string, number> => {
    const valueCounts: Record<string, number> = {}

    for (const dataSource of dataStore.dataSources.value) {
      const propertyIndex = dataStore.buildPropertyIndex(dataSource, propertyKey)
      const counts = mapValues(propertyIndex, (objectIds) => objectIds.length)

      // Merge counts from this data source
      Object.entries(counts).forEach(([value, count]) => {
        valueCounts[value] = (valueCounts[value] || 0) + count
      })
    }

    return valueCounts
  }

  const getPropertyExistenceCounts = (
    propertyKey: string
  ): { setCount: number; notSetCount: number } => {
    let setCount = 0
    let totalCount = 0

    for (const dataSource of dataStore.dataSources.value) {
      const propertyIndex = dataStore.buildPropertyIndex(dataSource, propertyKey)

      for (const objectIds of Object.values(propertyIndex)) {
        setCount += objectIds.length
      }

      totalCount += Object.keys(dataSource.objectMap).length
    }

    const notSetCount = totalCount - setCount

    return {
      setCount,
      notSetCount
    }
  }

  const getObjectIdsForPropertyValue = (
    propertyKey: string,
    value: string
  ): string[] => {
    const objectIds: string[] = []

    for (const dataSource of dataStore.dataSources.value) {
      const propertyIndex = dataStore.buildPropertyIndex(dataSource, propertyKey)
      if (propertyIndex && propertyIndex[value]) {
        objectIds.push(...propertyIndex[value])
      }
    }

    return objectIds
  }

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
        selectedValues: [...availableValues],
        condition: StringFilterCondition.Is,
        type: FilterType.String,
        filter: filter as StringPropertyInfo,
        numericRange: { min: 0, max: 100 },
        isDefaultAllSelected: true
      } satisfies StringFilterData
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

    const newFilterData = createFilterData({
      filter: newProperty,
      id: filterId,
      availableValues
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
    const instance = viewer.instance
    const index = filters.propertyFilters.value.findIndex((f) => f.id === filterId)
    if (index !== -1) {
      if (filters.activeColorFilterId.value === filterId) {
        removeColorFilter()
      }
      filters.propertyFilters.value.splice(index, 1)

      updateDataStoreSlices()
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
      filter.numericRange = { min, max }

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

        newFilterSlices.push(slice)
      } else if (
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
        newFilterSlices.push(slice)
      }
    })

    dataStore.dataSlices.value.push(...newFilterSlices)
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

  const revitPropertyRegex = /^parameters\./
  const revitPropertyRegexDui3000InstanceProps = /^properties\.Instance/
  const revitPropertyRegexDui3000TypeProps = /^properties\.Type/

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

    if (!availableFilterKeys.includes(key)) {
      return false
    }

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
    const backendKey = kvp.backendPath || kvp.key

    const directMatch = availableFilters?.some((f) => f.key === backendKey)
    if (directMatch) {
      return isPropertyFilterable(backendKey, availableFilters)
    }

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

    if (!availableKeys.includes(backendKey)) {
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
    const backendKey = kvp.backendPath || kvp.key

    let filter = availableFilters?.find((f: PropertyInfo) => f.key === backendKey)

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

    filteringExtension.removeColorFilter()

    filteringExtension.setColorFilter(filter.filter)

    filters.activeColorFilterId.value = filterId
  }

  /**
   * Removes color filtering from all objects
   */
  const removeColorFilter = () => {
    const filteringExtension = viewer.instance.getExtension(FilteringExtension)
    filteringExtension.removeColorFilter()

    filters.activeColorFilterId.value = null
  }

  /**
   * Toggles color filtering for a specific filter
   */
  const toggleColorFilter = (filterId: string) => {
    if (filters.activeColorFilterId.value === filterId) {
      removeColorFilter()
    } else {
      setColorFilter(filterId)
    }
  }

  /**
   * Gets the color groups from the FilteringExtension for the currently active color filter
   */
  const getFilterColorGroups = () => {
    const filteringExtension = viewer.instance.getExtension(FilteringExtension)
    const filteringState = filteringExtension.filteringState

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

    const color = colorGroup.color
    return color.startsWith('#') ? color : `#${color}`
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

    let values = getAvailableFilterValues(filter)

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
    getPropertyValueCounts,
    getPropertyExistenceCounts,
    getObjectIdsForPropertyValue,
    addActiveFilter,
    updateFilterProperty,
    removeActiveFilter,
    toggleFilterApplied,
    updateActiveFilterValues,
    updateFilterCondition,
    setFilterLogic,
    toggleActiveFilterValue,
    isActiveFilterValueSelected,
    resetFilters,
    resetExplode,
    waitForAvailableFilter,
    isRevitProperty,
    getRelevantFilters,
    getPropertyName,
    isKvpFilterable,
    getFilterDisabledReason,
    findFilterByKvp,
    // Color filtering functions
    setColorFilter,
    removeColorFilter,
    toggleColorFilter,
    getFilterValueColor,
    // Filtered values
    getFilteredFilterValues,
    // Numeric range filtering
    setNumericRange,
    // Filter logic
    currentFilterLogic: dataStore.currentFilterLogic
  }
}
